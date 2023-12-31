const _ = require("lodash");

const extractUserList = userList => {
  let clone = _.uniqBy(userList, item => item.username);

  clone = clone.map(item => {
    let filterItem = userList.filter(e => e.username == item.username);
    return extractOneUser(filterItem);
  });

  return clone;
};

const extractOneUser = userWithListInfo => {
  let user = userWithListInfo[0];
  user.role = extractUserRole(userWithListInfo);
  user.project = extractUserProject(userWithListInfo);
  return user;
};

const filterUserByRole = (listUsers, listRole) => {
  return listUsers.filter(user => {
    let userRoles = user.role.map(role => role.role);
    let intersection = _.intersection(userRoles, listRole);

    if (intersection.length) return true;
    else return false;
  });
};

// Utils user by role

const extractUserRole = userWithListInfo => {
  let listUserRole = userWithListInfo.map(e => ({ role_id: e.role_id, role: e.role })).filter(item => item.role_id);
  let roleList = _.uniqBy(listUserRole, item => item.role_id);
  return roleList;
};

const extractUserProject = userWithListInfo => {
  let listUserProject = userWithListInfo
    .map(e => { 
      const listTask = userWithListInfo.filter(i => i.project_id == e.project_id)?.map(it => (
          { 
            contentTask: it?.contentTask, status: it?.status, project: it.project, role: it.roleProject, start_date: it?.task_history_start, end_date: it?.task_history_end, score: it?.score
          }
        )
      )
      const total = listTask?.filter(i => i?.score && i?.score != 0)?.length
      const totalScore = listTask.reduce((prev, curr) => prev + (curr?.score || 0), 0)
      return {
        project_id: e.project_id, project: e.project, role: e.roleProject, listTask: listTask, averageScore: total != 0 ? (totalScore/total).toFixed(2) : 0
      }
     })
    .filter(item => item.project_id);

  let projectList = _.uniqBy(listUserProject, item => item.project_id);
  return projectList;
};

module.exports = {
  extractUserList,
  extractOneUser,
  filterUserByRole
};
