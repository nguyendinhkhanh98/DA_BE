const Formatter = require("response-format");
const Repository = require("../../repository/postgres-repository/role-project.repository");

module.exports.getListRoleProject = async (req, res) => {
  try {
    let listRoleProject = await Repository.getListRoleProject();
    res.json(Formatter.success(null, listRoleProject));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports.createRoleProject = async (req, res) => {
  try {
    if (!req.body.name) throw new Error("Name is empty");

    let newRole = await Repository.upsertRoleProject(req.body);
    res.json(Formatter.success("create_new_role_successfully", newRole));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};

module.exports.updateRoleProject = async (req, res) => {
  try {
    if (!req.body.name) throw new Error("Name is empty");

    let newRole = await Repository.upsertRoleProject(req.body);
    res.json(Formatter.success("update_role_successfully", newRole));
  } catch (error) {
    console.error(error);
    res.json(Formatter.badRequest());
  }
};
