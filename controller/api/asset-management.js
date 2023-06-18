const _ = require("lodash");
const jwt = require("jsonwebtoken");
const yaqrcode = require("yaqrcode");
const Excel = require("exceljs");
const { createNewUserMail } = require("../../service/email");
const knex = require("../../config/database");
const ResponseFormat = require("../../utils/response.format.js");
const UserRepository = require("../../repository/postgres-repository/user.repository");
const CompanyRepository = require("../../repository/postgres-repository/company.repository");
const StatusRepository = require("../../repository/postgres-repository/status.repository");
const PurposeRepository = require("../../repository/postgres-repository/purpose.repository");
const AssetHistoryRepository = require("../../repository/postgres-repository/asset-history.repository");
const AssetTypeRepository = require("../../repository/postgres-repository/asset-type.repository");
const AssetRepository = require("../../repository/postgres-repository/asset.repository");
const logger = require("../../utils/logger.js")(__filename);

const fetchUsers = async (req, res) => {
  const rawUsers = await UserRepository.getFullNameAndRole();
  const listUniqUserId = [...new Set(_.map(rawUsers, o => o.id))];

  const users = listUniqUserId.map(value => {
    let groupUser = _.filter(rawUsers, o => o.id == value);
    let user = { id: value, full_name: groupUser[0].full_name };
    user.role = groupUser.map(o => o.role);
    return user;
  });

  res.json(new ResponseFormat(200, true, users, "").toObject());
};

const fetchCompanies = async (req, res) => {
  let companies = await CompanyRepository.getAllCompany();
  res.json(new ResponseFormat(200, true, companies, "").toObject());
};

const fetchStatus = async (req, res) => {
  let status = await StatusRepository.getAllStatus();
  res.json(new ResponseFormat(200, true, status, "").toObject());
};

const fetchPurposes = async (req, res) => {
  let purposes = await PurposeRepository.getAll();
  res.json(new ResponseFormat(200, true, purposes, "").toObject());
};

const getStatusByID = async (req, res) => {
  let history = await AssetHistoryRepository.getHistoryByAssetId(req.query.id);
  res.json(new ResponseFormat(200, true, history, "").toObject());
};

const fetchAssetTypes = async (req, res) => {
  const list = await AssetTypeRepository.getAll();
  res.json(new ResponseFormat(200, true, list.rows, "").toObject());
};

const addAssetType = async (req, res) => {
  try {
    const assetType = {
      asset_type_code: req.body.asset_type_code,
      asset_type_name: req.body.asset_type_name,
      description: req.body.description || "",
      created_id: req.user.id
    };
    await AssetTypeRepository.insert(assetType);

    res.json(new ResponseFormat(200, true, [], "").toObject());
  } catch (error) {
    res.json(new ResponseFormat(400, false, [], "Insert failed to asset type").toObject());
  }
};

const editAssetType = async (req, res) => {
  try {
    let options = {};
    options.asset_type_code = req.body.asset_type_code || "";
    options.asset_type_name = req.body.asset_type_name || "";
    options.description = req.body.description || "";
    await AssetTypeRepository.update(options, { id: req.body.id });

    res.json(new ResponseFormat(200, true, [], "").toObject());
  } catch (error) {
    res.json(new ResponseFormat(400, false, [], "Update field for asset type failed").toObject());
  }
};

/**
 * Delete 2 level asset type
 * Level 1: Delete logic
 * Level 2: If not have reference, delete real. Else return error.
 *
 * @param {Request} req Request object from express
 * @param {Response} res Response object from express
 */
const deleteAssetType = async (req, res) => {
  try {
    await knex.transaction(async trx => {
      let items = await AssetTypeRepository.getAllByCondition({ id: req.query.id });
      let item = items[0];
      let flag = req.query.delete_flag == "true";

      if (!item) return res.json(new ResponseFormat(400, false, [], "Bad request").toObject());

      if (item.delete_flag == flag && flag) {
        // Delete level2
        let linking = await AssetTypeRepository.getAssetTypeIfExistAsset({ "asset.asset_type_id": item.id });

        if (linking.length) {
          // item.asset_type_code linking with value of asset table
          return res.json(new ResponseFormat(400, false, [], "Cannot delete this item").toObject());
        } else {
          await AssetTypeRepository.deleteByCondition({ id: req.query.id });
          return res.json(new ResponseFormat(200, true, [], "").toObject());
        }
      } else if (item.delete_flag == flag && !flag) {
        // delete level 1
        await AssetTypeRepository.update({ delete_flag: true }, { id: req.query.id });
        res.json(new ResponseFormat(200, true, [], "").toObject());
      } else {
        res.json(new ResponseFormat(400, false, [], "Bad request").toObject());
      }
    });
  } catch (error) {
    logger.error(error);
    res.json(new ResponseFormat(400, false, [], "Bad request").toObject());
  }
};

const restoreAssetType = async (req, res) => {
  try {
    await AssetTypeRepository.update({ delete_flag: false }, { id: req.body.id });
    res.json(new ResponseFormat(200, true, [], "").toObject());
  } catch (error) {
    logger.error(error);
    res.json(new ResponseFormat(500, false, [], "Failed from server").toObject());
  }
};

const restoreAllAssetType = async (req, res) => {
  try {
    await AssetTypeRepository.update({ delete_flag: false }, { delete_flag: true });
    res.json(new ResponseFormat(200, true, [], "").toObject());
  } catch (error) {
    logger.error(error);
    res.json(new ResponseFormat(500, false, [], "Restore failed at some item").toObject());
  }
};
/*******************************************************************************************
 *
 * Asset management
 *
 *******************************************************************************************/

const fetchAssets = async (req, res) => {
  if (req.query.asset_type_id) {
    try {
      let data = await AssetRepository.getAssetByAssetTypeId(req.query.asset_type_id);

      res.json(new ResponseFormat(200, true, data, "").toObject());
    } catch (error) {
      res.json(new ResponseFormat(400, false, error, "").toObject());
    }
  } else {
    let isAdmin = _.find(req.user.permissions, o => o == "admin" || o == "asset_admin");
    if (isAdmin) {
      let assets = await AssetRepository.getAll();
      res.json(new ResponseFormat(200, true, assets, "").toObject());
    } else {
      let assets = await AssetRepository.getAllByCondition({ manager_id: req.user.id });
      res.json(new ResponseFormat(200, true, assets, "").toObject());
    }
  }
};

const fetchAssetByJoin = async (req, res) => {
  try {
    let data = await AssetRepository.getAssetFullInfo();

    let history = await AssetHistoryRepository.getDistinctByAssetId();
    data = _.map(data, (value, key, origin) => {
      let h = _.find(history.rows, o => o.asset_id == value.id);
      return { ...value, status_comment: h ? h.comment : "" };
    });

    res.json(new ResponseFormat(200, true, data, "").toObject());
  } catch (error) {
    res.json(new ResponseFormat(400, false, error, "").toObject());
  }
};

const getAssetByID = async (req, res) => {
  try {
    let data = await AssetRepository.getAssetFullInfoByCondition({ "asset.id": req.query.id });

    let history = await AssetHistoryRepository.getAssetHistoryByCondition({
      asset_id: req.query.id,
      type: "change_status"
    });
    data[0].status_comment = history[0].comment;

    res.json(new ResponseFormat(200, true, data, "").toObject());
  } catch (error) {
    res.json(new ResponseFormat(400, false, error, "").toObject());
  }
};

const addAsset = async (req, res) => {
  let item = _.pick(req.body, [
    "asset_code",
    "asset_type_id",
    "asset_info",
    "purpose_id",
    "note",
    "company_id",
    "qr_code",
    "created_at",
    "buy_date",
    "status",
    "status_id"
  ]);
  item.created_id = req.user.id;
  try {
    await knex.transaction(async trx => {
      // Check foreign key by code
      let regex = /^\d+$/g;
      let types = await trx.select().from("asset_type").where({ id: item.asset_type_id });
      let users = await trx.select().from("user").where({ id: item.created_id });

      if (!regex.test(req.body.purpose_id)) {
        // purpose_id => string
        let purposes = await trx.select().from("purpose").where({ name: item.purpose_id });
        if (!purposes.length) {
          let ids = await trx("purpose").insert({ name: req.body.purpose_id }).returning("id");
          item.purpose_id = ids[0];
        } else item.purpose_id = purposes[0].id;
      }

      if (types.length == 0 || users.length == 0) {
        throw new Error("Bad request: asset type or user cannot found");
      }

      // if condition for foreign key == true
      let count_item = await trx.raw("SELECT nextval('asset_id_seq')");
      let now = new Date(Date.now());
      let year = now.getFullYear();
      let month = ("0" + (now.getUTCMonth() + 1)).slice(-2);
      let date = ("0" + now.getDate()).slice(-2);

      if (!item.asset_code)
        item.asset_code = `${types[0].asset_type_code}.${count_item.rows[0].nextval}.${year}${month}${date}`;
      if (!item.status) item.status = "InStock";
      item.qr_code = yaqrcode(count_item.rows[0].nextval);
      if (!item.buy_date) item = _.omit(item, "buy_date");
      if (!item.status_id) item.status_id = 2; // Using

      await trx("asset").insert({
        ...item,
        id: count_item.rows[0].nextval,
        manager_id: req.user.id
      });

      await trx("asset_history").insert({
        type: "change_status",
        asset_id: count_item.rows[0].nextval,
        comment: "",
        status_id_before: 5,
        status_id_after: item.status_id,
        user_change_id: req.user.id
      });

      await trx("asset_type").where({ id: item.asset_type_id }).increment("count", 1);
      res.json(new ResponseFormat(200, true, { id: count_item.rows[0].nextval }, "").toObject());
    });
  } catch (error) {
    logger.error(error);
    res.json(new ResponseFormat(400, false, [], error.message).toObject());
  }
};

const editAsset = async (req, res) => {
  let item = req.body;
  try {
    await knex.transaction(async trx => {
      let regex = /^\d+$/g;
      let resutl = !regex.test(req.body.purpose_id);
      if (resutl) {
        let ids = await PurposeRepository.insert(trx, { name: req.body.purpose_id });
        item.purpose_id = ids[0];
      }

      const asset = {
        asset_info: item.asset_info || "",
        purpose_id: item.purpose_id,
        note: item.note || "",
        company_id: item.company_id,
        asset_type_id: item.asset_type_id,
        buy_date: item.buy_date
      };
      const conditionUpdate = { id: item.id };
      await AssetRepository.update(trx, asset, conditionUpdate);

      res.json(new ResponseFormat(200, true, [], "").toObject());
    });
  } catch (error) {
    logger.error(error);
    res.json(new ResponseFormat(400, false, [], "Bad request: " + error.message).toObject());
  }
};

const deleteAsset = async (req, res) => {
  try {
    await knex.transaction(async trx => {
      let code = await AssetRepository.getAllByCondition({ id: req.query.id });

      if (code.length == 0) {
        throw new Error("Cannot found asset");
      }
      const newAssetHistory = {
        type: "change_status",
        asset_id: code[0].id,
        comment: "",
        status_id_before: code[0].status_id,
        status_id_after: 6,
        user_change_id: req.user.id
      };
      await AssetHistoryRepository.insert(trx, newAssetHistory);
      await AssetRepository.deleteAsset(trx, { id: req.query.id });
      await AssetTypeRepository.decrementByCondition(trx, 1, { id: code[0].asset_type_id });

      res.json(new ResponseFormat(200, true, [], "").toObject());
    });
  } catch (error) {
    logger.error(error);
    res.json(new ResponseFormat(400, true, [], "Cannot delete this item").toObject());
  }
};

const bindManager = async (req, res) => {
  let item = req.body;
  try {
    await knex.transaction(async trx => {
      let users = await UserRepository.getUserById(item.manager_id);
      let asset = await AssetRepository.getAllByCondition({ id: item.id });

      if (users.length == 0 && item.manager_id != -1) {
        throw new Error("Cannot found manager");
      }
      await AssetRepository.update(
        trx,
        {
          manager_id: item.manager_id,
          status_id: item.manager_id == -1 ? 1 : 3
        },
        { id: item.id }
      );

      await AssetHistoryRepository.insert(trx, {
        type: "assign_manager",
        asset_id: item.id,
        comment: "",
        status_id_before: asset[0].status_id,
        status_id_after: item.manager_id == -1 ? 1 : 3,
        user_change_id: req.user.id,
        manager_id_before: asset[0].manager_id,
        manager_id_after: item.manager_id
      });

      if (item.manager_id > 0) {
        // if bind to real user, send email
        // If bind to empty => don't send email
        let email = await trx("user").select("email").where({ id: item.manager_id });
        const token = jwt.sign({ id: item.manager_id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        email = email[0].email;
        let mailSubject = "[JIRA QCD] Bind asset successfully";
        let mailContent =
          `<p>Click <a href="${process.env.BASE_API_URL}/api/asset-management/asset/bind-confirm?id=${item.id}&token=${token}&origin=${req.headers.origin}">here</a> to confirm: </p>` +
          `<p>Asset code: ${item.asset_code}</p>`;
        createNewUserMail(email, mailSubject, mailContent);
      }

      res.json(new ResponseFormat(200, true, [], "").toObject());
    });
  } catch (error) {
    logger.error(error);
    res.json(new ResponseFormat(400, true, [], "Cannot assign to manager").toObject());
  }
};

const bindConfirm = async (req, res) => {
  let item = req.query;
  try {
    await knex.transaction(async trx => {
      let assets = await AssetRepository.getAllByCondition({ id: item.id });
      let decoded = jwt.verify(item.token, process.env.JWT_SECRET);

      if (assets[0].manager_id != decoded.id) {
        res.redirect(item.origin);
      } else {
        await AssetRepository.update(trx, { status_id: 2 }, { id: item.id });
        await AssetHistoryRepository.insert(trx, {
          type: "change_status",
          asset_id: assets[0].id,
          comment: "",
          status_id_before: assets[0].status_id,
          status_id_after: 2,
          user_change_id: decoded.id
        });

        res.redirect(item.origin);
      }
    });
  } catch (error) {
    logger.error(error);
    res.redirect(item.origin);
  }
};

const changeStatus = async (req, res) => {
  try {
    await knex.transaction(async trx => {
      let asset = await AssetRepository.getAllByCondition({ id: req.body.id });
      if (req.body.status_id == asset[0].status_id) {
        let history = await AssetHistoryRepository.getAssetHistoryByCondition({
          asset_id: req.body.id,
          type: "change_status"
        });
        if (history.length && history[0]) {
          await AssetRepository.update(trx, { status_id: req.body.status_id }, { id: req.body.id });
          await AssetHistoryRepository.update({ comment: req.body.comment }, { id: history[0].id });
        } else throw new Error("Cannot found record match");
      } else {
        await AssetHistoryRepository.insert(trx, {
          type: "change_status",
          asset_id: req.body.id,
          comment: req.body.comment || "",
          status_id_before: asset[0].status_id,
          status_id_after: req.body.status_id,
          user_change_id: req.user.id
        });
        await AssetRepository.update(trx, { status_id: req.body.status_id }, { id: req.body.id });
      }
      res.json(new ResponseFormat(200, true, [], "").toObject());
    });
  } catch (error) {
    logger.error(error);
    res.json(new ResponseFormat(400, false, [], error.message || "Failed to change status").toObject());
  }
};

const exportAssetToExcel = async (req, res) => {
  let resource = await AssetHistoryRepository.getAssetByOrderFields();
  let data = req.body.length
    ? _.intersectionBy(resource, req.body, function (item) {
        if (typeof item == "number") return item;
        else return item.id;
      })
    : resource;

  var workbook = writeAssetToExcel(data);

  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.setHeader("Content-Disposition", `attachment; filename=QCD_Asset_Management.xlsx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  workbook.xlsx.write(res).then(function () {
    res.end();
  });
};

const writeAssetToExcel = data => {
  var rows = [];
  for (let i = 0; i < data.length; i++) {
    let row = _.values(data[i]);
    rows.push(row);
  }
  var workbook = new Excel.Workbook();
  workbook.creator = "giapdong";
  workbook.lastModifiedBy = "giapdong";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();
  workbook.properties.date1904 = true;

  var worksheet = workbook.addWorksheet("QCD Management");
  let columns = [
    {
      name: "STT",
      cell: "A1",
      width: 5,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Asset Code",
      cell: "B1",
      width: 20,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Asset Type",
      cell: "C1",
      width: 20,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Sumary info",
      cell: "D1",
      width: 30,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Purpose",
      cell: "E1",
      width: 12,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Status",
      cell: "F1",
      width: 20,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Owner",
      cell: "G1",
      width: 25,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Company",
      cell: "H1",
      width: 18,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Detail info",
      cell: "I1",
      width: 20,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Buy date",
      cell: "J1",
      width: 12,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    },
    {
      name: "Created date",
      cell: "K1",
      width: 12,
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0052cc" }
      }
    }
  ];
  worksheet.addTable({
    name: "JiraReportTable",
    ref: "A1",
    headerRow: true,
    columns: columns,
    rows: rows
  });

  columns.forEach((column, index) => {
    worksheet.getCell(column.cell).value = column.name;
    worksheet.getCell(column.cell).alignment = {
      vertical: "middle",
      horizontal: "center"
    };
    // column width
    worksheet.getColumn(index + 1).width = column.width;
    // column color
    worksheet.getCell(column.cell).fill = column.fill;
  });

  var borderStyles = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  };
  worksheet.eachRow({ includeEmpty: true }, function (row, rowNumber) {
    row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
      cell.border = borderStyles;
      const colsAlignRight = [7, 9, 10, 11, 17];
      if (rowNumber > 1) {
        if (colsAlignRight.indexOf(colNumber) > -1) {
          cell.alignment = { horizontal: "right" };
        }
      }
    });
  });
  return workbook;
};

module.exports = {
  fetchUsers,
  fetchCompanies,
  fetchStatus,
  fetchPurposes,
  getStatusByID,

  fetchAssetTypes,
  addAssetType,
  editAssetType,
  deleteAssetType,
  restoreAssetType,
  restoreAllAssetType,

  fetchAssets,
  fetchAssetByJoin,
  getAssetByID,
  addAsset,
  editAsset,
  deleteAsset,
  bindManager,
  bindConfirm,
  changeStatus,

  exportAssetToExcel
};
