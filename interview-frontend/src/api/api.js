const api_url = "http://localhost:10010";

const requestJson = async (url, options = {}) => {
    const response = await fetch(url, options);

    if (!response.ok) {
        const error = new Error(`Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) return null;

    return await response.json();
};

const normalizeAssignments = (assignments = []) =>
    assignments
        .map((assignment) => {
            const user = assignment.user || assignment.assignedUser || assignment;
            const userId = assignment.userId || user?.userId || user?.id || null;
            const name = user?.name || assignment.userName || assignment.name || null;

            if (!userId || !name) return null;

            return {
                userId,
                name,
            };
        })
        .filter(Boolean);

export const startPlan = async () => {
    const url = `${api_url}/Plan`;
    return await requestJson(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
    });
};

export const addProcedureToPlan = async (planId, procedureId) => {
    const url = `${api_url}/Plan/AddProcedureToPlan`;
    const command = { planId: Number(planId), procedureId };

    await requestJson(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
    });

    return true;
};

export const getProcedures = async () => {
    const url = `${api_url}/Procedures`;
    return await requestJson(url, { method: "GET" });
};

export const getPlanProcedures = async (planId) => {
    const url = `${api_url}/PlanProcedure?$filter=planId eq ${planId}&$expand=procedure,assignedUsers($expand=user)`;
    const response = await requestJson(url, { method: "GET" });

    return (response || []).map((planProcedure) => ({
        ...planProcedure,
        assignments: normalizeAssignments(planProcedure.assignedUsers || []),
    }));
};

export const getUsers = async () => {
    const url = `${api_url}/Users`;
    return await requestJson(url, { method: "GET" });
};

export const createProcedureAssignment = async (planId, procedureId, userId) => {
    const url = `${api_url}/PlanProcedure/AssignUser`;
    const payload = { planId: Number(planId), procedureId, userId };
    const response = await requestJson(url, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const assignments = normalizeAssignments([response || payload]);
    return assignments[0] || { userId, name: null };
};

export const deleteProcedureAssignment = async (planId, procedureId, userId) => {
    const url = new URL(`${api_url}/PlanProcedure/RemoveUser`);
    url.searchParams.set("planId", Number(planId));
    url.searchParams.set("procedureId", procedureId);
    url.searchParams.set("userId", userId);

    await requestJson(url.toString(), { method: "DELETE" });
    return true;
};

export const clearProcedureAssignments = async (planId, procedureId) => {
    const url = new URL(`${api_url}/PlanProcedure/RemoveAllUsers`);
    url.searchParams.set("planId", Number(planId));
    url.searchParams.set("procedureId", procedureId);

    await requestJson(url.toString(), { method: "DELETE" });
    return true;
};
