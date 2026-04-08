import React from "react";

const ProcedureItem = ({ procedure, handleAddProcedureToPlan,handleRemoveProcedureFromPlan, planProcedures }) => {
    const checkboxId = `procedure-${procedure.procedureId}`;
    const isChecked = planProcedures.some(
        (planProcedure) => planProcedure.procedureId === procedure.procedureId
    );

    return (
        <div className="procedure-item py-2">
            <div className="form-check procedure-check">
                <input
                    className="form-check-input"
                    type="checkbox"
                    value=""
                    id={checkboxId}
                    checked={isChecked}
                    onChange={(e) => {
                        if (e.target.checked) {
                            handleAddProcedureToPlan(procedure);
                        } else {
                            handleRemoveProcedureFromPlan(procedure);
                        }
                    }}
                />
                <label className="form-check-label" htmlFor={checkboxId}>
                    {procedure.procedureTitle}
                </label>
            </div>
        </div>
    );
};

export default ProcedureItem;
