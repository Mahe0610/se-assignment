  import React, { useEffect, useState } from "react";
  import { useParams } from "react-router-dom";
  import {
    addProcedureToPlan,
    clearProcedureAssignments,
    createProcedureAssignment,
    deleteProcedureAssignment,
    removeProcedureFromPlan,
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

    const handleRemoveProcedureFromPlan = async (procedure) => {
  try {
    await removeProcedureFromPlan(id, procedure.procedureId);

    // refresh plan procedures (same as add)
    setPlanProcedures(await getPlanProcedures(id));

    setErrorMessage("");
  } catch (error) {
    console.error(error);
    setErrorMessage("We could not remove that procedure from the plan.");
  }
};

    const handleAssignUsers = async (planProcedure, nextUsers, previousUsers) => {
      try {
        const next = nextUsers || [];

        const previousUserIds = new Set(previousUsers.map((user) => user.userId));
        const nextUserIds = new Set(next.map((user) => user.value));

        const isRemoveAll =
          previousUsers.length > 1 &&
          (nextUsers === null || next.length === 0);

        if (isRemoveAll) {
          await clearProcedureAssignments(
            planProcedure.planId,
            planProcedure.procedureId
          );

          setPlanProcedures((prev) =>
            prev.map((item) =>
              getPlanProcedureKey(item) === getPlanProcedureKey(planProcedure)
                ? { ...item, assignments: [] }
                : item
            )
          );

          return;
        }

        const usersToAdd = next.filter((u) => !previousUserIds.has(u.value));

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

        const usersToRemove = previousUsers.filter(
          (user) => !nextUserIds.has(user.userId)
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
          previousState.map((item) =>
            getPlanProcedureKey(item) === getPlanProcedureKey(planProcedure)
              ? { ...item, assignments: [] }
              : item
          )
        );

        setErrorMessage("");
      } catch (error) {
        console.error(error);
        setErrorMessage("We could not clear users.");
      }
    };

    return (
      <Layout>
        <div className="container pt-4">
          <div className="row mt-4">
            <div className="col-lg-5">
              <h4>Procedures</h4>
              {procedures.map((procedure) => (
                <ProcedureItem
                  key={procedure.procedureId}
                  procedure={procedure}
                  handleAddProcedureToPlan={handleAddProcedureToPlan}
                  handleRemoveProcedureFromPlan={handleRemoveProcedureFromPlan}
                  planProcedures={planProcedures}
                />
              ))}
            </div>

            <div className="col-lg-7">
              <h4>Added to Plan</h4>
              {planProcedures.map((planProcedure) => (
                <PlanProcedureItem
                  key={getPlanProcedureKey(planProcedure)}
                  planProcedure={planProcedure}
                  users={users}
                  onAssignUsers={handleAssignUsers}
                  onRemoveAssignedUser={handleRemoveAssignedUser}
                  onClearAssignedUsers={handleClearAssignedUsers}
                />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  };

  export default Plan;
