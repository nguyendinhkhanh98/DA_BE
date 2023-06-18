const Formatter = require("response-format");
const DocumentRepository = require("../../repository/postgres-repository/document.repository");
const APIErrorWithKnex = require("../../utils/APIException/APIErrorWithKnex");
const _ = require("lodash");

module.exports.getDocumentById = async (req, res, next) => {
  try {
    let item = await DocumentRepository.getDocumentById(req.params.id);
    res.json(Formatter.success(null, item));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getAllSpec = async (req, res, next) => {
  try {
    let items = await DocumentRepository.getAllSpec();
    res.json(Formatter.success(null, items));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getAllTags = async (req, res, next) => {
  try {
    let items = await DocumentRepository.getAllTags();
    res.json(Formatter.success(null, items));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.createTag = async (req, res, next) => {
  try {
    let items = await DocumentRepository.createTag(req.body);
    res.json(Formatter.success(null, items[0]));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.searchTag = async (req, res, next) => {
  try {
    let items = await DocumentRepository.searchTag(req.query.key);
    res.json(Formatter.success(null, items));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getLastDocNum = async (req, res, next) => {
  try {
    let items = await DocumentRepository.getLastDocNum(req.query.specId);
    items = items.filter(i => i.doc_number.slice(1, 5) == new Date().getFullYear());
    let lastNumber;
    if (!items.length) lastNumber = "init";
    else {
      let listNums = items.map(item => parseInt(item.doc_number.slice(6)));
      lastNumber = Math.max(...listNums);
    }
    res.json(Formatter.success(null, lastNumber));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.getListCategories = async (req, res, next) => {
  try {
    let items = await DocumentRepository.getListCategories();
    res.json(Formatter.success(null, items));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateOrCreateCategory = async (req, res, next) => {
  try {
    let items = await DocumentRepository.updateOrCreateCategory(req.body);
    res.json(Formatter.success(null, items[0]));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.updateOrCreateDocument = async (req, res, next) => {
  let payload = req.body;
  payload.userId = req.user.id;
  try {
    await DocumentRepository.updateOrCreateDocument(payload);
    res.json(Formatter.success());
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.searchDocument = async (req, res, next) => {
  try {
    let items = [];
    let response = await DocumentRepository.searchDocument(req.body);
    let mapData = _.groupBy(response, "doc_number");
    let relatedDocIds = [...new Set(response.map(doc => doc.doc_url_id).filter(id => id))];
    let allRelatedDocs = await DocumentRepository.getRelatedDocsByIds(relatedDocIds);

    for (const key in mapData) {
      if (Object.hasOwnProperty.call(mapData, key)) {
        const element = mapData[key];
        if (!element.length) continue;
        let listTags = [];
        let relatedDocs = [];
        for (let i = 0; i < element.length; i++) {
          const item = element[i];
          if (!item.tag_name || listTags.includes(item.tag_name));
          else listTags.push(item.tag_name);
          if (item.doc_url_id && relatedDocs.findIndex(doc => doc.id == item.doc_url_id && doc.type == item.type) == -1)
            relatedDocs.push({ id: item.doc_url_id, type: item.type });
        }
        items.push({
          creator: element[0].creator,
          docNumber: key,
          id: element[0].id,
          url: element[0].url,
          projectName: element[0].project_name,
          projecId: element[0].project_id,
          listTags: listTags,
          upperDocs: relatedDocs
            .filter(doc => doc.type == "UP")
            .map(innerDoc => ({ ...allRelatedDocs.find(d => d.id == innerDoc.id) })),
          lowerDocs: relatedDocs
            .filter(doc => doc.type == "LW")
            .map(innerDoc => ({ ...allRelatedDocs.find(d => d.id == innerDoc.id) })),
          refDocs: relatedDocs
            .filter(doc => doc.type == "RF")
            .map(innerDoc => ({ ...allRelatedDocs.find(d => d.id == innerDoc.id) })),
          createdAt: element[0].created_at,
          title: element[0].title,
          specId: element[0].spec_id
        });
      }
    }
    res.json(Formatter.success(null, items));
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.deleteCategory = async (req, res, next) => {
  try {
    await DocumentRepository.deleteCategory(req.params.id);
    res.json(Formatter.success());
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};

module.exports.deleteDocument = async (req, res, next) => {
  const { id } = req.params;
  try {
    await DocumentRepository.deleteDocument(id);
    res.json(Formatter.success());
  } catch (error) {
    next(new APIErrorWithKnex({ errors: error }));
  }
};
