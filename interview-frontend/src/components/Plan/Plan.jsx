import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addProcedureToPlan,
  clearProcedureAssignments,
  createProcedureAssignment,
  deleteProcedureAssignment,
  getPlanProcedures,
  getProcedures,
  getUsers,
} from "../../api/api";
import Layout from "../Layout/Layout";
import ProcedureItem from "./ProcedureItem/ProcedureItem";
import PlanProcedureItem from "./PlanProcedureItem/PlanProcedureItem";

const getPlanProcedureKey = ({ planId, procedureId }) => `${planId}:${procedureId}`;

const Plan = () => {
  const { id } = useParams();
  const [procedures, setProcedures] = useState([]);
  const [planProcedures, setPlanProcedures] = useState([]);
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      try {
        const [loadedProcedures, loadedPlanProcedures, loadedUsers] = await Promise.all([
          getProcedures(),
          getPlanProcedures(id),
          getUsers(),
        ]);

        if (isCancelled) return;

        setUsers(
          loadedUsers.map((user) => ({
            label: user.name,
            value: user.userId,
          }))
        );
        setProcedures(loadedProcedures);
        setPlanProcedures(loadedPlanProcedures);
        setErrorMessage("");
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          setErrorMessage(
            "We could not load the plan details. Please verify the API is running and refresh the page."
          );
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [id]);


  const handleAddProcedureToPlan = async (procedure) => {
    const hasProcedureInPlan = planProcedures.some(
      (planProcedure) => planProcedure.procedureId === procedure.procedureId
    );

    if (hasProcedureInPlan) return;

    try {
      await addProcedureToPlan(id, procedure.procedureId);
      setPlanProcedures(await getPlanProcedures(id));
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("We could not add that procedure to the plan.");
    }
  };

  const handleAssignUsers = async (planProcedure, nextUsers, previousUsers) => {
    try {
      const previousUserIds = new Set(previousUsers.map((user) => user.userId));
      const nextUserIds = new Set(nextUsers.map((user) => user.value));
      const usersToAdd = nextUsers.filter((user) => !previousUserIds.has(user.value));
      const usersToRemove = previousUsers.filter((user) => !nextUserIds.has(user.userId));

      const createdAssignments = await Promise.all(
        usersToAdd.map(async (user) => {
          const assignment = await createProcedureAssignment(
            planProcedure.planId,
            planProcedure.procedureId,
            user.value
          );

          return {
            userId: user.value,
            name: assignment.name || user.label,
          };
        })
      );

      await Promise.all(
        usersToRemove.map((user) =>
          deleteProcedureAssignment(planProcedure.planId, planProcedure.procedureId, user.userId)
        )
      );

      setPlanProcedures((previousState) =>
        previousState.map((item) => {
          if (getPlanProcedureKey(item) !== getPlanProcedureKey(planProcedure)) {
            return item;
          }

          const remainingAssignments = item.assignments.filter(
            (assignment) => !usersToRemove.some((user) => user.userId === assignment.userId)
          );

          return {
            ...item,
            assignments: [...remainingAssignments, ...createdAssignments],
          };
        })
      );
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("We could not update the user assignments for that procedure.");
    }
  };

  const handleRemoveAssignedUser = async (planProcedure, assignedUser) => {
    try {
      await deleteProcedureAssignment(planProcedure.planId, planProcedure.procedureId, assignedUser.userId);

      setPlanProcedures((previousState) =>
        previousState.map((item) => {
          if (getPlanProcedureKey(item) !== getPlanProcedureKey(planProcedure)) {
            return item;
          }

          return {
            ...item,
            assignments: item.assignments.filter((assignment) => assignment.userId !== assignedUser.userId),
          };
        })
      );
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("We could not remove that user from the procedure.");
    }
  };

  const handleClearAssignedUsers = async (planProcedure) => {
    if (planProcedure.assignments.length === 0) return;

    try {
      await clearProcedureAssignments(planProcedure.planId, planProcedure.procedureId);
      setPlanProcedures((previousState) =>
        previousState.map((item) => {
          if (getPlanProcedureKey(item) !== getPlanProcedureKey(planProcedure)) return item;
          return {
            ...item,
            assignments: [],
          };
        })
      );
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("We could not remove all assigned users from that procedure.");
    }
  };

  return (
    <Layout>
      <div className="container pt-4">
        <div className="d-flex justify-content-center">
          <h2>OEC Interview Frontend</h2>
        </div>
        <div className="row mt-4">
          <div className="col">
            <div className="card shadow border-0">
              <h5 className="card-header plan-card-header">Repair Plan</h5>
              <div className="card-body p-4">
                {errorMessage ? (
                  <div className="alert alert-danger" role="alert">
                    {errorMessage}
                  </div>
                ) : null}
                <div className="row g-4">
                  <div className="col-lg-5">
                    <div className="plan-column h-100">
                      <h4>Procedures</h4>
                      <p className="text-muted mb-3">
                        Select the procedures needed to complete the vehicle repair plan.
                      </p>
                      <div>
                        {procedures.map((procedure) => (
                          <ProcedureItem
                            key={procedure.procedureId}
                            procedure={procedure}
                            handleAddProcedureToPlan={handleAddProcedureToPlan}
                            planProcedures={planProcedures}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-7">
                    <div className="plan-column h-100">
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                        <div>
                          <h4 className="mb-1">Added to Plan</h4>
                          <p className="text-muted mb-0">
                            Assign team members, remove individual users, or clear a procedure.
                          </p>
                        </div>
                        <span className="plan-pill">
                          {planProcedures.length} procedure{planProcedures.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="d-grid gap-3">
                        {planProcedures.length > 0 ? (
                          planProcedures.map((planProcedure) => (
                            <PlanProcedureItem
                              key={getPlanProcedureKey(planProcedure)}
                              planProcedure={planProcedure}
                              users={users}
                              onAssignUsers={handleAssignUsers}
                              onRemoveAssignedUser={handleRemoveAssignedUser}
                              onClearAssignedUsers={handleClearAssignedUsers}
                            />
                          ))
                        ) : (
                          <div className="empty-state border rounded-3 p-4 text-center text-muted">
                            No procedures have been added yet. Choose one from the left to get started.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Plan;
