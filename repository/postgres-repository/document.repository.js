const knex = require("../../config/database.js");

// Spec Type
module.exports.getAllSpec = () => {
  return knex("doc_spec_type").select();
};

// Document Tag
module.exports.getAllTags = () => {
  return knex("doc_tag").select().limit(20);
};

module.exports.createTag = body => {
  return knex("doc_tag").insert({ name: body.name }).returning("*");
};

module.exports.searchTag = key => {
  return knex("doc_tag").select().where("name", "like", `${key}%`).limit(10);
};

// Manage Category
module.exports.getListCategories = () => {
  return knex("doc_type").select().orderBy(["doc_type.created_at"]);
};

module.exports.updateOrCreateCategory = body => {
  if (body.id) return knex("doc_type").update({ name: body.name }).where({ id: body.id }).returning("*");
  return knex("doc_type").insert({ name: body.name }).returning("*");
};

module.exports.deleteCategory = id => {
  return knex("doc_type").delete().where({ id });
};

// Document
module.exports.searchDocument = async body => {
  const tagCondition = body.listTags.length ? `and tag.id in (${body.listTags})` : ``;
  const specCondition = body.specId ? `and dm.spec_id = (${body.specId})` : ``;
  const projectCondition = body.projectId != -1 ? `and dm.project_id = (${body.projectId})` : ``;
  const rawQuery = knex.raw(`
  select dm.doc_number as doc_number,
    dm.id,
    dm.title,
    dm.url,
    dm.spec_id,
    dm.created_at,
    durb.doc_url_id,
    durb.type,
    tag.name      as tag_name,
    up.full_name  as creator,
    task.name     as project_name,
    task.id       as project_id
  from doc_main as dm
      left join doc_tag_refered_by dtrb on dm.id = dtrb.doc_main_id
      left join doc_tag tag on dtrb.doc_tag_id = tag.id
      left join doc_spec_type dst on dm.spec_id = dst.id
      left join doc_url_refered_by durb on dm.id = durb.doc_main_id
      left join task on dm.project_id = task.id
      left join user_profile up on dm.user_id = up.id
  where dm.delete_flag = false
  ${tagCondition}
  ${projectCondition}
  ${specCondition}
  and (dm.title iLIKE '%${body.filterName}%' or dm.doc_number like '${body.filterName}%')
  order by dm.created_at
  `);
  return knex.with("list_docs", rawQuery).select("*").from("list_docs");
};

module.exports.updateOrCreateDocument = async body => {
  if (body.id) return await updateDocument(body);
  return await createDocument(body);
};

const createDocument = body => {
  return knex.transaction(async trx => {
    // Handle Insert file url
    body.listUpperFiles.forEach(item => (item.type = "UP"));
    body.listLowerFiles.forEach(item => (item.type = "LW"));
    body.listReferFiles.forEach(item => (item.type = "RF"));
    let listFileUrl = [...body.listUpperFiles, ...body.listLowerFiles, ...body.listReferFiles];

    // Handle Insert doc main
    let bodyInsertDoc = {
      doc_number: body.docNumber,
      user_id: body.userId,
      title: body.title,
      description: body.description,
      project_id: body.projectId,
      spec_id: body.specId,
      url: body.url
    };
    const docMainId = await knex("doc_main").insert(bodyInsertDoc, "id").transacting(trx);

    if (listFileUrl.length) {
      let listUrls = listFileUrl.map(item => {
        return {
          doc_url_id: item.id,
          doc_main_id: docMainId[0],
          type: item.type
        };
      });
      await knex("doc_url_refered_by").insert(listUrls).transacting(trx);
    }

    if (body.listTags.length) {
      let listTags = body.listTags.map(item => {
        return {
          doc_tag_id: item,
          doc_main_id: docMainId[0]
        };
      });
      await knex("doc_tag_refered_by").insert(listTags).transacting(trx);
    }
  });
};

const updateDocument = body => {
  const docId = body.id;
  return knex.transaction(async trx => {
    // Handle update tag by doc id
    let listTagFound = await getListTagByDocId(docId);
    listTagFound = listTagFound.map(item => item.id);
    let listTagNeedInsert = body.listTags.filter(item => !listTagFound.includes(item));
    let listTagNeedRemove = listTagFound.filter(item => !body.listTags.includes(item));
    if (listTagNeedInsert.length) {
      let listTagsInsert = listTagNeedInsert.map(item => {
        return {
          doc_tag_id: item,
          doc_main_id: docId
        };
      });
      await knex("doc_tag_refered_by").insert(listTagsInsert).transacting(trx);
    }
    if (listTagNeedRemove.length)
      for (let i = 0; i < listTagNeedRemove.length; i++) {
        const element = listTagNeedRemove[i];
        await knex("doc_tag_refered_by")
          .where({
            doc_tag_id: element,
            doc_main_id: docId
          })
          .del()
          .transacting(trx);
      }

    // Handle update ref by doc id
    body.listUpperFiles.forEach(item => (item.type = "UP"));
    body.listLowerFiles.forEach(item => (item.type = "LW"));
    body.listReferFiles.forEach(item => (item.type = "RF"));
    let listDocFound = await getListDocRef(docId);
    let listFileUrl = [...body.listUpperFiles, ...body.listLowerFiles, ...body.listReferFiles];
    let listRefNeedInsert = listFileUrl.filter(
      o1 => listDocFound.filter(o2 => o2["type"] === o1["type"] && o2["id"] === o1["id"]).length === 0
    );
    let listRefNeedRemove = listDocFound.filter(
      o1 => listFileUrl.filter(o2 => o2["type"] === o1["type"] && o2["id"] === o1["id"]).length === 0
    );
    if (listRefNeedInsert.length) {
      let listRefInsert = listRefNeedInsert.map(item => {
        return {
          doc_url_id: item.id,
          doc_main_id: docId,
          type: item.type
        };
      });
      await knex("doc_url_refered_by").insert(listRefInsert).transacting(trx);
    }
    if (listRefNeedRemove.length)
      for (let i = 0; i < listRefNeedRemove.length; i++) {
        const element = listRefNeedRemove[i];
        await knex("doc_url_refered_by")
          .where({
            doc_url_id: element.id,
            doc_main_id: docId,
            type: element.type
          })
          .del()
          .transacting(trx);
      }

    // Handle update normal info of doc main
    let bodyUpdateDoc = {
      title: body.title,
      description: body.description,
      project_id: body.projectId,
      spec_id: body.specId,
      url: body.url
    };
    await knex("doc_main").update(bodyUpdateDoc).where({ id: docId }).transacting(trx);
  });
};

module.exports.deleteDocument = id => {
  return knex("doc_main").update({ delete_flag: true }).where({ id: id }).returning("id");
};

module.exports.getLastDocNum = specId => {
  return knex("doc_main")
    .select("doc_number")
    .where("doc_number", "like", `${specId == 1 ? "S" : specId == 2 ? "R" : "D"}%`);
};

module.exports.getRelatedDocsByIds = ids => {
  return knex("doc_main")
    .select("id", "doc_number", "title", "url")
    .whereIn("id", ids)
    .andWhere("delete_flag", "=", false);
};

module.exports.getDocumentById = async id => {
  const rawQuery = knex.raw(`
  select dm.doc_number as doc_number,
    dm.id,
    dm.url,
    dm.title,
    dm.spec_id,
    dm.created_at,
    dm.description,
    up.full_name  as creator,
    task.name     as project_name,
    task.id       as project_id
  from doc_main as dm
      left join doc_spec_type dst on dm.spec_id = dst.id
      left join task on dm.project_id = task.id
      left join user_profile up on dm.user_id = up.id
  where dm.delete_flag = false
  and dm.id = ${id}
  `);
  let docMainFound = await knex.with("list_docs", rawQuery).select("*").from("list_docs").first();
  if (!docMainFound) throw "error";

  // Query list tag
  let listTagFound = await getListTagByDocId(id);

  // Query list doc reference
  let listDocFound = await getListDocRef(id);

  // Assign value
  docMainFound.listTags = listTagFound.length ? listTagFound : [];
  docMainFound.listDocsRelated = listDocFound.length ? listDocFound : [];
  return docMainFound;
};

const getListTagByDocId = id => {
  const queryGetTagByDocId = knex.raw(`
    select doc_tag.id, name
    from doc_tag
            left join doc_tag_refered_by dtrb on doc_tag.id = dtrb.doc_tag_id
    where doc_main_id = ${id}
    `);
  return knex.with("list_tags", queryGetTagByDocId).select("*").from("list_tags");
};

const getListDocRef = id => {
  const queryGetDocRef = knex.raw(`
  select dm.title, dm.url, dm.id, type
  from doc_url_refered_by
          left join doc_main dm on dm.id = doc_url_refered_by.doc_url_id
  where doc_main_id = ${id}
        and dm.delete_flag = false
  `);
  return knex.with("list_doc_ref", queryGetDocRef).select("*").from("list_doc_ref");
};
