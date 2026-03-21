import React from "react";
import ReactSelect from "react-select";

const PlanProcedureItem = ({
  planProcedure,
  users,
  onAssignUsers,
  onRemoveAssignedUser,
  onClearAssignedUsers,
}) => {
  const procedureId = planProcedure.planProcedureId || planProcedure.procedureId;
  const selectedUsers = planProcedure.assignments.map((assignment) => ({
    label: assignment.name,
    value: assignment.userId,
  }));

  return (
    <div className="plan-procedure-item border rounded-3 p-3">
      <div className="d-flex justify-content-between gap-3 flex-wrap align-items-start">
        <div>
          <div className="plan-procedure-title">{planProcedure.procedure?.procedureTitle || "Procedure"}</div>
          <div className="text-muted small mt-1">
            {planProcedure.assignments.length > 0
              ? `${planProcedure.assignments.length} user${
                  planProcedure.assignments.length === 1 ? "" : "s"
                } assigned`
              : "No users assigned yet"}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline-danger btn-sm"
          disabled={planProcedure.assignments.length === 0}
          onClick={() => onClearAssignedUsers(procedureId)}
        >
          Remove All Users
        </button>
      </div>

      <ReactSelect
        className="mt-3"
        classNamePrefix="plan-select"
        placeholder="Select User to Assign"
        isMulti={true}
        isClearable={true}
        closeMenuOnSelect={false}
        options={users}
        value={selectedUsers}
        onChange={(nextSelectedUsers) =>
          onAssignUsers(procedureId, nextSelectedUsers || [], planProcedure.assignments)
        }
      />

      <div className="assigned-user-list mt-3">
        {planProcedure.assignments.length > 0 ? (
          planProcedure.assignments.map((assignedUser) => (
            <div
              key={`${procedureId}-${assignedUser.userId}`}
              className="assigned-user-chip"
            >
              <span>{assignedUser.name}</span>
              <button
                type="button"
                className="btn btn-link btn-sm assigned-user-remove"
                onClick={() => onRemoveAssignedUser(procedureId, assignedUser)}
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <div className="text-muted small">Assigned users will appear here after selection.</div>
        )}
      </div>
    </div>
  );
};

export default PlanProcedureItem;
