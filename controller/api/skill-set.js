const _ = require("lodash");
const knex = require("../../config/database");
const SkillSetRepository = require("../../repository/postgres-repository/skill-set.repository");
const UserRepository = require("../../repository/postgres-repository/user.repository");
const SkillSetUtils = require("../../utils/skill-set.util");
const ResponseFormat = require("../../utils/response.format.js");
const logger = require("../../utils/logger.js")(__filename);
const statusSkill = {
  WaittingReview: "Waiting for review",
  Approved: "Approved",
  Open: "Open",
  Draft: "Draft",
  Rejected: "Rejected"
};
const Excel = require("exceljs");
const ProfileRepository = require("../../repository/postgres-repository/user-profile.repository");

//
//
//
// =============================> SKILL SET ACTION <=============================//
// =============================> SKILL SET ACTION <=============================//
// =============================> SKILL SET ACTION <=============================//
//
//
//
//
const FetchSkillSet = async (req, res) => {
  const { type } = req.query;

  switch (type) {
    case "empty":
      HandleSkillSetEmpty(req, res);
      break;
    case "view":
      HandleSkillSetView(req, res);
      break;
  }
};

const HandleSkillSetEmpty = async (req, res) => {
  try {
    let latestData = await SkillSetRepository.getLatestSkillSetApproved(req.user.id);

    let data = await SkillSetRepository.getListSkillSetWithNullValue();

    _.map(latestData, item => {
      let skill_index = _.findIndex(data.rows, row => row.id == item.id);
      item.last_experience_time = item.experience_time;
      item.last_level = item.level_review;
      data.rows[skill_index] = item;
    });

    res.json(new ResponseFormat(200, true, data.rows, null).toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const HandleSkillSetView = async (req, res) => {
  const { user_period_id } = req.query;
  try {
    let role = await knex("user_period").where({ id: user_period_id });
    let isUser = role[0].user_id == req.user.id;
    let isLeader = role[0].leader_id == req.user.id;
    let isAdmin = req.user.permissions.includes("admin") || req.user.permissions.includes("manager");
    if (!(isUser || isLeader || isAdmin)) return res.status(403).json({ error: "Permission denied" });

    if (role[0].status == statusSkill.Draft || role[0].status == statusSkill.Rejected) {
      let currentData = await SkillSetRepository.getDraftSkillSetByPeriodId(user_period_id);
      let latestData = await SkillSetRepository.getLatestSkillSetByPeriodId(user_period_id, req.user.id);
      let data = await SkillSetRepository.getListSkillSetWithNullValue();

      // Merge latest data with current data
      currentData = SkillSetUtils.supplementLastDataForCurrentSkillSet(latestData, currentData);

      _.map(currentData, item => {
        let skill_index = _.findIndex(data.rows, row => row.id == item.id);
        data.rows[skill_index] = item;
      });

      res.json(new ResponseFormat(200, true, data.rows, null).toObject());
    } else {
      let latestData = await SkillSetRepository.getLatestSkillSetCreated(role[0].user_id, user_period_id);
      let data = await SkillSetRepository.getLatestSkillSetByUserPeriodId(user_period_id);

      latestData.forEach(old_skill => {
        let skill_index = _.findIndex(data, row => row.id == old_skill.id);
        if (skill_index >= 0 && data[skill_index]) {
          data[skill_index].last_experience_time = old_skill.experience_time;
          data[skill_index].last_level = old_skill.level_review;
        }
      });

      res.json(new ResponseFormat(200, true, data, "").toObject());
    }
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const CreateSkillSet = async (req, res) => {
  const { period, data, mode } = req.body;
  const user_id = req.user.id;
  try {
    let canSubmit = await getEvaluationAvailability(user_id, period.period_id);
    if (!canSubmit) {
      res.json(
        new ResponseFormat(400, false, null, `Your submission for this period has already been recorded!`).toObject()
      );
      return;
    }
    await knex.transaction(async trx => {
      let userPeriods = await trx("user_period")
        .insert({
          period_id: period.period_id,
          user_id: user_id,
          leader_id: period.leader_id,
          status: mode == "create" ? statusSkill.WaittingReview : statusSkill.Draft
        })
        .returning("id");

      const promise = [];
      for (let index = 0; index < data.length; index++) {
        const skill = data[index];
        let options = {
          user_period_id: userPeriods[0],
          skill_id: parseInt(skill.id),
          experience_time: skill.experience_time,
          level: skill.level
        };
        await trx("skill_set").insert(options);
      }

      await Promise.all(promise);

      res.json(new ResponseFormat(200, true, userPeriods[0], `Create skill-set successfuly`).toObject());
    });
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const getEvaluationAvailability = async (userId, periodId) => {
  let existedSubmissions = await knex("user_period")
    .select("id")
    .where("period_id", "=", periodId)
    .andWhere("user_id", "=", userId);
  return !existedSubmissions.length;
};

const UpdateSkillSet = async (req, res) => {
  const { period, data } = req.body;
  try {
    await knex.transaction(async trx => {
      const promise = [];
      promise.push(trx("user_period").update({ status: statusSkill.Approved }).where({ id: period.id }));

      for (let index = 0; index < data.length; index++) {
        const skill = data[index];
        let options = {
          level_review: parseInt(skill.level_review),
          note: skill.note
        };
        await trx("skill_set").update(options).where({ id: skill.skill_set_id });
      }

      await Promise.all(promise);

      res.json(new ResponseFormat(200, true, null, "Update your skill set successfuly").toObject());
    });
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

//
//
//
// =============================> PERIOD ACTION <=============================//
// =============================> PERIOD ACTION <=============================//
// =============================> PERIOD ACTION <=============================//
//
//
//
//

const FetchPeriod = async (req, res) => {
  const { type } = req.query;

  switch (type) {
    case "empty":
      HandlePeriodEmpty(req, res);
      break;
    case "view":
      HandlePeriodView(req, res);
      break;
  }
};

const HandlePeriodEmpty = async (req, res) => {
  const user_id = req.user.id;
  try {
    let data = await knex
      .with("period_empty", knex.raw(`select distinct period_id from user_period where user_id = ${user_id}`))
      .select("*")
      .from("period")
      .leftJoin("period_empty", "period.id", "period_empty.period_id")
      .where({ "period_empty.period_id": null, "period.delete_flag": false })
      .whereRaw("CURRENT_DATE between start_date and end_date")
      .orderBy("created_at", "desc");

    res.json(new ResponseFormat(200, true, data, "").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const HandlePeriodView = async (req, res) => {
  try {
    let data = await knex.select("*").from("period").where({ delete_flag: false }).orderBy("created_at", "desc");

    res.json(new ResponseFormat(200, true, data, "").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const CreatePeriod = async (req, res) => {
  const { name, start_date, end_date, description } = req.body;
  try {
    await knex("period").insert({
      name,
      start_date,
      end_date,
      description: description || null
    });
    res.json(new ResponseFormat(200, true, null, `Đã tạo kỳ đánh giá mới: '${name}'`).toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const UpdatePeriod = async (req, res) => {
  const { id, name, start_date, end_date, description } = req.body;
  try {
    await SkillSetRepository.updatePeriod(id, name, start_date, end_date, description);
    res.json(new ResponseFormat(200, true, null, `Đã cập nhật cho kỳ đánh giá: '${name}'`).toObject());
  } catch (error) {
    console.error(error);
    res.json(new ResponseFormat(400, false, null, `Xin lỗi, không thể cập nhật cho kỳ đánh giá này`).toObject());
  }
};

const DeletePeriod = async (req, res) => {
  let { period_id } = req.query;
  try {
    await SkillSetRepository.deleteHardPeriod(period_id);
  } catch (error) {
    await SkillSetRepository.deleteLogicPeriod(period_id);
  }
  res.json(new ResponseFormat(200, true, null, `Đã xóa kỳ đánh giá!`).toObject());
};

const getAllPeriod = async (req, res) => {
  try {
    let data = await SkillSetRepository.getAllPeriod();
    res.json(new ResponseFormat(200, true, data, null).toObject());
  } catch (error) {
    console.error(error);
    res.json(new ResponseFormat(500, false, null, `Xin lỗi, máy chủ không thể đáp ứng yêu cầu`).toObject());
  }
};

const getAllDevUser = async (req, res) => {
  try {
    let data = await SkillSetRepository.getAllDevUser();
    res.json(new ResponseFormat(200, true, data, null).toObject());
  } catch (error) {
    console.error(error);
    res.json(new ResponseFormat(500, false, null, `Xin lỗi, máy chủ không thể đáp ứng yêu cầu`).toObject());
  }
};

const restorePeriod = async (req, res) => {
  let { period_id } = req.body;
  try {
    let data = await SkillSetRepository.restorePeriod(period_id);
    res.json(new ResponseFormat(200, true, data, "Khôi phục thành công kỳ đánh giá!").toObject());
  } catch (error) {
    console.error(error);
    res.json(new ResponseFormat(500, false, null, `Xin lỗi, máy chủ không thể đáp ứng yêu cầu`).toObject());
  }
};

//
//
//
// =============================> DRAFT SKILL SET ACTION <=============================//
// =============================> DRAFT SKILL SET ACTION <=============================//
// =============================> DRAFT SKILL SET ACTION <=============================//
//
//
//
//

const UpdateDraftSkillSet = async (req, res) => {
  const { period, data, leader_id } = req.body;
  let listIdSkill = data.map(item => item.id);
  try {
    await knex.transaction(async trx => {
      let promise = [];
      for (let index = 0; index < data.length; index++) {
        const skill = data[index];
        let user_period_id = period.id;
        let skill_id = skill.id;
        let experience_time = parseInt(skill.experience_time);
        let level = parseInt(skill.level);

        await SkillSetRepository.upsertSkillSet(user_period_id, skill_id, experience_time, level);
      }

      promise.push(trx("user_period").update({ leader_id }).where({ id: period.id }));

      await Promise.all(promise);

      let listOutOfList = await SkillSetRepository.getListSkillDeletedWithAssessment(period.id, listIdSkill);
      if (listOutOfList.length) {
        await SkillSetRepository.cleanupSkillSet(listOutOfList);
      }

      res.json(new ResponseFormat(200, true, period.id, "Store draft successfuly").toObject());
    });
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const RejectSkillSet = async (req, res) => {
  try {
    await knex("user_period").update({ status: statusSkill.Rejected }).where({ id: req.body.id });
    res.json(new ResponseFormat(200, true, null, "Rejected assessment!").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const CommitDraftSkillSet = async (req, res) => {
  const { period, data, leader_id } = req.body;
  let listIdSkill = data.map(item => item.id);
  try {
    await knex.transaction(async trx => {
      const promise = [];

      promise.push(trx("user_period").update({ status: statusSkill.WaittingReview }).where({ id: period.id }));

      for (let index = 0; index < data.length; index++) {
        const skill = data[index];
        let user_period_id = period.id;
        let skill_id = parseInt(skill.id);
        let experience_time = parseInt(skill.experience_time);
        let level = parseInt(skill.level);

        await SkillSetRepository.upsertSkillSet(user_period_id, skill_id, experience_time, level);
      }

      promise.push(trx("user_period").update({ leader_id }).where({ id: period.id }));

      await Promise.all(promise);

      let listOutOfList = await SkillSetRepository.getListSkillDeletedWithAssessment(period.id, listIdSkill);
      if (listOutOfList.length) {
        await SkillSetRepository.cleanupSkillSet(listOutOfList);
      }

      res.json(new ResponseFormat(200, true, null, "Commit new skill set successfuly").toObject());
    });
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

//
//
//
// =============================> CATEGORY ACTION <=============================//
// =============================> CATEGORY ACTION <=============================//
// =============================> CATEGORY ACTION <=============================//
//
//
//
//

const FetchCategory = async (req, res) => {
  try {
    let data = await knex("skill")
      .column(
        "skill.id",
        {
          category: "skill_category.name",
          category_id: "skill_category.id",
          skill_description: "skill.description",
          category_description: "skill_category.description",
          category_delete_flag: "skill_category.delete_flag",
          skill_delete_flag: "skill.delete_flag"
        },
        "skill.name",
        "skill_category.sort"
      )
      .select()
      .leftJoin("skill_category", "skill_category.id", "skill.category_id")
      .whereRaw(`skill.delete_flag IS NOT true and skill_category.delete_flag IS NOT true`);

    let newestData = await knex("skill_category")
      .column(
        "skill.id",
        {
          category: "skill_category.name",
          category_id: "skill_category.id",
          skill_description: "skill.description",
          category_description: "skill_category.description",
          category_delete_flag: "skill_category.delete_flag",
          skill_delete_flag: "skill.delete_flag"
        },
        "skill.name",
        "skill_category.sort"
      )
      .select()
      .leftJoin("skill", "skill_category.id", "skill.category_id")
      .whereRaw(`skill.delete_flag IS NOT true and skill_category.delete_flag IS NOT true and skill.id is null`);
    data = data.concat(newestData);

    res.json(new ResponseFormat(200, true, data, "Get data successfuly").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const CreateCategory = async (req, res) => {
  try {
    let data = await knex("skill_category")
      .insert({
        name: req.body.name,
        description: req.body.description
      })
      .returning("*");
    res.json(new ResponseFormat(200, true, data, "Create category successfuly").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const UpdateCategory = async (req, res) => {
  let { skills, category } = req.body;
  try {
    let promise = _.map(skills, item => {
      item.id = item.id ? item.id : "DEFAULT";
      item.category_id = item.category_id ? item.category_id : null;
      return SkillSetRepository.upsertSkill(item.id, item.name, item.category_id, item.skill_description);
    });

    promise = promise.concat(
      category.map((item, index, origin) => {
        item.category = item.category ? item.category : null;
        item.sort = index + 1;
        return knex("skill_category").where("id", item.category_id).update({
          name: item.category,
          sort: item.sort,
          description: item.description
        });
      })
    );

    await Promise.all(promise);

    res.json(new ResponseFormat(200, true, null, "Update category successfuly").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const DeleteCategory = async (req, res) => {
  try {
    await knex.transaction(async trx => {
      await trx("skill").where("category_id", req.query.id).update({
        category_id: null
      });

      await trx("skill_category").where("id", req.query.id).delete();

      res.json(new ResponseFormat(200, true, null, "Delete category successfuly").toObject());
    });
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

//
//
//
// =============================> SKILL ACTION <=============================//
// =============================> SKILL ACTION <=============================//
// =============================> SKILL ACTION <=============================//
//
//
//
//

const FetchSkill = async (req, res) => {
  try {
    let data = await knex("skill")
      .column(
        "skill.id",
        {
          category: "skill_category.name",
          category_id: "skill_category.id",
          skill_description: "skill.description",
          category_description: "skill_category.description"
        },
        "skill.name"
      )
      .select()
      .leftJoin("skill_category", "skill_category.id", "skill.category_id")
      .whereNotNull("skill.category_id")
      .orderBy("skill_category.sort");

    res.json(new ResponseFormat(200, true, data, "").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const FetchSkillConfigure = async (req, res) => {
  try {
    let data = await knex("skill")
      .column(
        "skill.id",
        {
          category: "skill_category.name",
          category_id: "skill_category.id",
          skill_description: "skill.description",
          category_description: "skill_category.description",
          skill_delete_flag: "skill.delete_flag"
        },
        "skill.name",
        "skill.tag"
      )
      .select()
      .leftJoin("skill_category", "skill_category.id", "skill.category_id")
      .orderBy("skill_category.sort");

    res.json(new ResponseFormat(200, true, data, "").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const CreateSkill = async (req, res) => {
  try {
    let data = await knex("skill")
      .insert({
        name: req.body.name,
        description: req.body.description,
        category_id: req.body.category_id
      })
      .returning("*");
    res.json(new ResponseFormat(200, true, data, "Create skill successfuly").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const UpdateSkill = async (req, res) => {
  try {
    for (let index = 0; index < req.body.length; index++) {
      const item = req.body[index];
      let optionsUpdate = {
        name: item.name,
        description: item.description,
        category_id: item.category_id,
        delete_flag: item.delete_flag
      };
      if (Array.isArray(item.tag) && item.tag.length) optionsUpdate.tag = JSON.stringify(item.tag);
      else optionsUpdate.tag = null;

      await knex("skill").where("id", item.id).update(optionsUpdate);
    }

    let listSkillNonUsing = await SkillSetRepository.getListSkillDeletedAndEmptyInSkillSet();
    if (listSkillNonUsing && listSkillNonUsing.length) {
      let actionCleanupSkill = SkillSetRepository.cleanupSkillDeprecated(listSkillNonUsing);
      await Promise.all(actionCleanupSkill);
    }

    res.json(new ResponseFormat(200, true, null, "Update skill successfuly").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

//
//
//
// =============================> UTILS ACTION <=============================//
// =============================> UTILS ACTION <=============================//
// =============================> UTILS ACTION <=============================//
//
//
//
//

const FetchPeriodByUserID = async (req, res) => {
  const user_id = req.user.id;
  const isAll = isNaN(req.params.user_period_id);
  let isAdmin = req.user.permissions.includes("admin") || req.user.permissions.includes("manager");
  let isLeader = req.user.permissions.includes("leader");

  if (isAll) {
    try {
      let data = await SkillSetRepository.getSkillSetByUserRole({
        user_id,
        isAdmin,
        isLeader
      });

      if (isAdmin || isLeader) {
        data = data.filter(item => {
          if ([statusSkill.Draft, statusSkill.Rejected].includes(item.status)) {
            if (item.user_id == user_id) return true;
            else return false;
          }

          return true;
        });
      }
      res.json(new ResponseFormat(200, true, data, "").toObject());
    } catch (error) {
      HandleErrorKnex(res, error);
    }
  } else {
    try {
      let data = await SkillSetRepository.getSkillSetByUserPeriodId(req.params.user_period_id);
      res.json(new ResponseFormat(200, true, data, "").toObject());
    } catch (error) {
      HandleErrorKnex(res, error);
    }
  }
};

const exportSkillSetSummaryLastest = async (req, res) => {
  const { user_id } = req.body;

  const fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "0052cc" }
  };

  const fontWhite = {
    color: { argb: "FFFFFF" },
    bold: true,
    size: 14
  };

  const borderStyles = {
    top: { style: "thin", color: { argb: "FFFFFF" } },
    left: { style: "thin", color: { argb: "FFFFFF" } },
    bottom: { style: "thin", color: { argb: "FFFFFF" } },
    right: { style: "thin", color: { argb: "FFFFFF" } }
  };

  try {
    let users = await UserRepository.getUserIn(user_id);
    let skillSets = await SkillSetRepository.getAllSkillSetSummary(user_id);
    let periodName = skillSets[0].period;
    // Prepare Data
    let eSkills = await SkillSetRepository.getAllSkill();
    eSkills.forEach(item => (item.isBSkill = false));
    let bSkils = await SkillSetRepository.getAllBusinessSkill();
    bSkils.forEach(item => (item.isBSkill = true));
    let allSkills = eSkills.concat(bSkils);
    let allSkillsByUser = [];
    users.forEach(user => {
      let userSkill = { userId: user.id, skillSets: [], userName: user.fullName };
      skillSets.forEach(skillSet => {
        if (skillSet.user_id == user.id) {
          userSkill.skillSets.push(skillSet);
        }
      });
      allSkillsByUser.push(userSkill);
    });

    // Set Header
    let firstRow = ["Skill", "", "", ""];
    let secondRow = ["Type", "Category", "Skill", "Max level"];
    let rowsData = [];
    allSkillsByUser.forEach(userSkill => {
      firstRow.push(userSkill.userName);
      firstRow.push("");
      secondRow.push("Experience time(months)");
      secondRow.push("Level");
    });
    // Set Data row
    allSkills.forEach(skill => {
      rowData = [];
      rowData.push(skill.isBSkill ? "Business Skill" : "Engineer Skill");
      rowData.push(skill.category);
      rowData.push(skill.skill);
      rowData.push(4);
      allSkillsByUser.forEach(userSkill => {
        let userSkillSet = userSkill.skillSets.find(skillset => skillset.skill == skill.skill);
        if (userSkillSet) {
          rowData.push(userSkillSet.experience_time);
          rowData.push(userSkillSet.level_review);
        } else {
          rowData.push(0);
          rowData.push(0);
        }
      });
      rowsData.push(rowData);
    });

    // Write to workbook
    let workbook = new Excel.Workbook();
    workbook.creator = "giapdong";
    workbook.lastModifiedBy = "anhnd";
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    workbook.properties.date1904 = true;

    let worksheet = workbook.addWorksheet("SkillSetTable");

    // Add row data to worksheet
    var firstRowExcel = worksheet.addRow(firstRow);
    var secondRowExcel = worksheet.addRow(secondRow);
    rowsData.forEach(row => {
      worksheet.addRow(row);
    });

    // Merge first row
    worksheet.mergeCells([1, 1, 1, 4]);
    firstRow.forEach((column, index) => {
      if (index > 3 && column) worksheet.mergeCells([1, index + 1, 1, index + 2]);
    });

    worksheet.columns.forEach((column, i) => {
      var maxLength = 0;
      column["eachCell"]({ includeEmpty: true }, (cell, cellIndex) => {
        if (cellIndex > 1) {
          cell.alignment = {
            wrapText: true
          };
          var columnLength = cell.value ? cell.value.toString().length + 3 : 0;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        }
      });
      column.width = maxLength > 40 ? 40 : maxLength;
    });

    // Make style for first row
    firstRowExcel.eachCell((cell, colNumber) => {
      cell.font = fontWhite;
      cell.fill = fill;
      cell.alignment = {
        vertical: "middle",
        horizontal: "center"
      };
      cell.border = borderStyles;
    });

    // Make style for second row
    secondRowExcel.eachCell((cell, colNumber) => {
      cell.font = fontWhite;
      cell.fill = fill;
      cell.alignment = {
        vertical: "middle",
        horizontal: "center"
      };
      cell.border = borderStyles;
    });

    // Frozen worksheet view
    worksheet.views = [{ state: "frozen", xSplit: 4, ySplit: 2 }];

    // set header & file name
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Disposition", `attachment; filename=QCD_Skill_Set_${periodName}.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    workbook.xlsx.write(res).then(function () {
      res.end();
    });
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const FetchLevels = async (req, res) => {
  try {
    let data = await knex("levels").orderBy("level");
    res.json(new ResponseFormat(200, true, data, "Get data successfuly").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

const ExportSumarryByUser = async (req, res) => {
  let { selected_id } = req.body;
  if (!selected_id) {
    return res.json(new ResponseFormat(400, false, null, "Bad request").toObject());
  }

  let listUserProfile = await ProfileRepository.getListUserProfileByUserId(selected_id);
  listUserProfile = await SkillSetRepository.appendLatestAssessmentApproved(listUserProfile);

  let skillInLanguage = await SkillSetRepository.getListSkillIdFromCategoryName("Programming Languages");
  let skillIdInLanguage = skillInLanguage.map(skill => skill.skill_id);
  let skillInFrameworks = await SkillSetRepository.getListSkillIdFromCategoryName("Frameworks");
  let skillIdInFrameworks = skillInFrameworks.map(skill => skill.skill_id);
  let skillInTechnologies = await SkillSetRepository.getListSkillIdFromCategoryName("Technologies");
  let skillIdInTechnologies = skillInTechnologies.map(skill => skill.skill_id);

  listUserProfile = await SkillSetRepository.appendSkillSetInfoToListUserProfile(
    listUserProfile,
    skillIdInLanguage,
    skillIdInFrameworks,
    skillIdInTechnologies
  );

  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Disposition", `attachment; filename=SumarryReportSkillSet.zip`);
  res.setHeader("Content-Type", "application/zip");

  let zipFileBufferData = await SkillSetUtils.getZipFileSumarryReport(listUserProfile);
  res.send(zipFileBufferData);
};

const updateEngineerLeaderById = async (req, res) => {
  try {
    let { id, leader_id } = req.body;
    let data = await knex("user_period").update({ leader_id: leader_id }).where("id", "=", id);
    res.json(new ResponseFormat(200, true, null, "Updated successfully").toObject());
  } catch (error) {
    HandleErrorKnex(res, error);
  }
};

//
//
//
// =============================> HANDLE FUNCTION <=============================//
// =============================> HANDLE FUNCTION <=============================//
// =============================> HANDLE FUNCTION <=============================//
//
//
//
//
const HandleErrorKnex = (res, error) => {
  logger.error(error);
  switch (error.code) {
    case "23502":
      res.json(new ResponseFormat(400, false, null, "Contain at least a field undefined.").toObject());
      break;
    case "23505":
      res.json(new ResponseFormat(400, false, null, error.detail).toObject());
      break;
    case "22P02":
      res.json(new ResponseFormat(400, false, null, error.detail || "Invalid data").toObject());
      break;

    default:
      res.json(new ResponseFormat(400, false, null, "Bad request!").toObject());
      break;
  }
};

module.exports = {
  FetchSkillSet,
  CreateSkillSet,
  UpdateSkillSet,

  FetchPeriod,
  CreatePeriod,
  UpdatePeriod,
  DeletePeriod,
  getAllPeriod,
  getAllDevUser,
  restorePeriod,
  updateEngineerLeaderById,

  CommitDraftSkillSet,
  UpdateDraftSkillSet,
  RejectSkillSet,

  FetchCategory,
  CreateCategory,
  UpdateCategory,
  DeleteCategory,

  FetchSkill,
  FetchSkillConfigure,
  CreateSkill,
  UpdateSkill,

  FetchPeriodByUserID,
  exportSkillSetSummaryLastest,
  FetchLevels,

  ExportSumarryByUser
};
