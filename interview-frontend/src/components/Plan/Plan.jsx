import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  addProcedureToPlan,
  clearProcedureAssignments,
  createProcedureAssignment,
  deleteProcedureAssignment,
  getPlanProcedures,
  getProcedureAssignments,
  getProcedures,
  getStoredAssignmentUserIds,
  getUsers,
} from "../../api/api";
import Layout from "../Layout/Layout";
import ProcedureItem from "./ProcedureItem/ProcedureItem";
import PlanProcedureItem from "./PlanProcedureItem/PlanProcedureItem";

const getEmbeddedAssignments = (planProcedure) => {
  const embeddedAssignments =
    planProcedure.procedureUsers || planProcedure.assignedUsers || planProcedure.users || [];

  return embeddedAssignments
    .map((assignment) => {
      const user = assignment.user || assignment.assignedUser || assignment;
      const userId = assignment.userId || user?.userId || user?.id;
      const name = user?.name || assignment.userName || assignment.name;

      if (!userId || !name) return null;

      return {
        assignmentId:
          assignment.planProcedureUserId ||
          assignment.planProcedureAssignedUserId ||
          assignment.procedureAssignmentId ||
          assignment.id ||
          null,
        userId,
        name,
      };
    })
    .filter(Boolean);
};

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

        const userOptions = loadedUsers.map((user) => ({
          label: user.name,
          value: user.userId,
        }));

        const enrichedPlanProcedures = await Promise.all(
          loadedPlanProcedures.map(async (planProcedure) => {
            const embeddedAssignments = getEmbeddedAssignments(planProcedure);

            if (embeddedAssignments.length > 0) {
              return {
                ...planProcedure,
                assignments: embeddedAssignments,
              };
            }

            const fetchedAssignments = await getProcedureAssignments(
              planProcedure.planProcedureId || planProcedure.procedureId
            );

            return {
              ...planProcedure,
              assignments: fetchedAssignments.map((assignment) => ({
                ...assignment,
                name:
                  assignment.name ||
                  loadedUsers.find((user) => user.userId === assignment.userId)?.name ||
                  "Unknown user",
              })),
            };
          })
        );

        setUsers(userOptions);
        setProcedures(loadedProcedures);
        setPlanProcedures(enrichedPlanProcedures);
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

  const userLookup = useMemo(
    () => new Map(users.map((user) => [user.value, user.label])),
    [users]
  );

  const handleAddProcedureToPlan = async (procedure) => {
    const hasProcedureInPlan = planProcedures.some(
      (planProcedure) => planProcedure.procedureId === procedure.procedureId
    );

    if (hasProcedureInPlan) return;

    try {
      await addProcedureToPlan(id, procedure.procedureId);
      const refreshedPlanProcedures = await getPlanProcedures(id);
      const addedPlanProcedure =
        refreshedPlanProcedures.find(
          (planProcedure) => planProcedure.procedureId === procedure.procedureId
        ) || {
          planProcedureId: procedure.procedureId,
          planId: id,
          procedureId: procedure.procedureId,
          procedure: {
            procedureId: procedure.procedureId,
            procedureTitle: procedure.procedureTitle,
          },
        };

      const cachedAssignments = getStoredAssignmentUserIds(
        addedPlanProcedure.planProcedureId || addedPlanProcedure.procedureId
      ).map((userId) => ({
        assignmentId: null,
        userId,
        name: userLookup.get(userId) || "Unknown user",
      }));

      setPlanProcedures((previousState) => [
        ...previousState,
        {
          ...addedPlanProcedure,
          assignments: cachedAssignments,
        },
      ]);
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("We could not add that procedure to the plan.");
    }
  };

  const handleAssignUsers = async (planProcedureId, nextUsers, previousUsers) => {
    try {
      const previousUserIds = new Set(previousUsers.map((user) => user.userId));
      const nextUserIds = new Set(nextUsers.map((user) => user.value));
      const usersToAdd = nextUsers.filter((user) => !previousUserIds.has(user.value));
      const usersToRemove = previousUsers.filter((user) => !nextUserIds.has(user.userId));

      const createdAssignments = await Promise.all(
        usersToAdd.map(async (user) => {
          const assignment = await createProcedureAssignment(planProcedureId, user.value);
          return {
            assignmentId: assignment.assignmentId,
            userId: user.value,
            name: user.label,
          };
        })
      );

      await Promise.all(
        usersToRemove.map((user) =>
          deleteProcedureAssignment(planProcedureId, user.assignmentId, user.userId)
        )
      );

      setPlanProcedures((previousState) =>
        previousState.map((planProcedure) => {
          if ((planProcedure.planProcedureId || planProcedure.procedureId) !== planProcedureId) {
            return planProcedure;
          }

          const remainingAssignments = planProcedure.assignments.filter(
            (assignment) => !usersToRemove.some((user) => user.userId === assignment.userId)
          );

          return {
            ...planProcedure,
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

  const handleRemoveAssignedUser = async (planProcedureId, assignedUser) => {
    try {
      await deleteProcedureAssignment(
        planProcedureId,
        assignedUser.assignmentId,
        assignedUser.userId
      );

      setPlanProcedures((previousState) =>
        previousState.map((planProcedure) => {
          if ((planProcedure.planProcedureId || planProcedure.procedureId) !== planProcedureId) {
            return planProcedure;
          }

          return {
            ...planProcedure,
            assignments: planProcedure.assignments.filter(
              (assignment) => assignment.userId !== assignedUser.userId
            ),
          };
        })
      );
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage("We could not remove that user from the procedure.");
    }
  };

  const handleClearAssignedUsers = async (planProcedureId) => {
    const planProcedure = planProcedures.find(
      (item) => (item.planProcedureId || item.procedureId) === planProcedureId
    );

    if (!planProcedure || planProcedure.assignments.length === 0) return;

    try {
      await clearProcedureAssignments(planProcedureId, planProcedure.assignments);
      setPlanProcedures((previousState) =>
        previousState.map((item) => {
          if ((item.planProcedureId || item.procedureId) !== planProcedureId) return item;
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
                              key={planProcedure.planProcedureId || planProcedure.procedureId}
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
