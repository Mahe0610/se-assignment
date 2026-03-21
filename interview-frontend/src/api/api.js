const api_url = "http://localhost:10010";
const ASSIGNMENT_STORAGE_KEY = "planProcedureAssignments";

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

const getStoredAssignmentCache = () => {
    try {
        return JSON.parse(window.localStorage.getItem(ASSIGNMENT_STORAGE_KEY) || "{}");
    } catch (error) {
        console.warn("Failed to read assignment cache", error);
        return {};
    }
};

const saveStoredAssignmentCache = (cache) => {
    window.localStorage.setItem(ASSIGNMENT_STORAGE_KEY, JSON.stringify(cache));
};

const getPlanProcedureCacheKey = (planProcedureId) => String(planProcedureId);

const updateStoredAssignments = (planProcedureId, userIds) => {
    const cache = getStoredAssignmentCache();
    cache[getPlanProcedureCacheKey(planProcedureId)] = userIds;
    saveStoredAssignmentCache(cache);
};

const removeStoredAssignments = (planProcedureId) => {
    const cache = getStoredAssignmentCache();
    delete cache[getPlanProcedureCacheKey(planProcedureId)];
    saveStoredAssignmentCache(cache);
};

export const getStoredAssignmentUserIds = (planProcedureId) => {
    const cache = getStoredAssignmentCache();
    return cache[getPlanProcedureCacheKey(planProcedureId)] || [];
};

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
    const command = { planId, procedureId };

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
    const expandStatements = [
        "procedure",
        "procedureUsers($expand=user)",
        "assignedUsers($expand=user)",
        "users($expand=user)",
    ];

    const queries = [
        `${api_url}/PlanProcedure?$filter=planId eq ${planId}&$expand=${expandStatements.join(",")}`,
        `${api_url}/PlanProcedure?$filter=planId eq ${planId}&$expand=procedure`,
    ];

    for (const url of queries) {
        try {
            return (await requestJson(url, { method: "GET" })) || [];
        } catch (error) {
            if (url === queries[queries.length - 1]) throw error;
        }
    }

    return [];
};

export const getUsers = async () => {
    const url = `${api_url}/Users`;
    return await requestJson(url, { method: "GET" });
};

const assignmentCollectionCandidates = [
    "PlanProcedureUser",
    "PlanProcedureUsers",
    "PlanProcedureAssignedUser",
    "PlanProcedureAssignedUsers",
    "ProcedureAssignment",
    "ProcedureAssignments",
];

const assignmentDeleteActionCandidates = [
    "PlanProcedureUser/RemoveUserFromProcedure",
    "PlanProcedureAssignedUser/RemoveUserFromProcedure",
    "ProcedureAssignment/RemoveUserFromProcedure",
];

const assignmentClearActionCandidates = [
    "PlanProcedureUser/RemoveAllUsersFromProcedure",
    "PlanProcedureAssignedUser/RemoveAllUsersFromProcedure",
    "ProcedureAssignment/RemoveAllUsersFromProcedure",
];

const normalizeAssignments = (assignments = []) =>
    assignments
        .map((assignment) => {
            const user = assignment.user || assignment.assignedUser || assignment.Users || assignment;
            const userId =
                assignment.userId ||
                assignment.assignedUserId ||
                user?.userId ||
                user?.id ||
                null;
            const name = user?.name || user?.fullName || assignment.userName || assignment.name || null;

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

export const getProcedureAssignments = async (planProcedureId) => {
    for (const collection of assignmentCollectionCandidates) {
        const url = `${api_url}/${collection}?$filter=planProcedureId eq ${planProcedureId}&$expand=user`;

        try {
            const response = await requestJson(url, { method: "GET" });
            const assignments = normalizeAssignments(response || []);
            updateStoredAssignments(
                planProcedureId,
                assignments.map((assignment) => assignment.userId)
            );
            return assignments;
        } catch (error) {
            if (error.status && error.status !== 404) {
                console.warn(`Failed to load ${collection}`, error);
            }
        }
    }

    return getStoredAssignmentUserIds(planProcedureId).map((userId) => ({
        assignmentId: null,
        userId,
        name: null,
    }));
};

export const createProcedureAssignment = async (planProcedureId, userId) => {
    const payload = { planProcedureId, userId };

    for (const collection of assignmentCollectionCandidates) {
        const url = `${api_url}/${collection}`;

        try {
            const response = await requestJson(url, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const assignments = normalizeAssignments([response || payload]);
            const assignment = assignments[0] || { assignmentId: null, userId, name: null };
            const cachedIds = new Set(getStoredAssignmentUserIds(planProcedureId));
            cachedIds.add(userId);
            updateStoredAssignments(planProcedureId, [...cachedIds]);
            return assignment;
        } catch (error) {
            if (error.status && error.status !== 404) {
                console.warn(`Failed to create ${collection}`, error);
            }
        }
    }

    const cachedIds = new Set(getStoredAssignmentUserIds(planProcedureId));
    cachedIds.add(userId);
    updateStoredAssignments(planProcedureId, [...cachedIds]);
    return { assignmentId: null, userId, name: null };
};

export const deleteProcedureAssignment = async (planProcedureId, assignmentId, userId) => {
    const cachedIds = getStoredAssignmentUserIds(planProcedureId).filter((id) => id !== userId);

    if (assignmentId) {
        for (const collection of assignmentCollectionCandidates) {
            const url = `${api_url}/${collection}/${assignmentId}`;

            try {
                await requestJson(url, { method: "DELETE" });
                updateStoredAssignments(planProcedureId, cachedIds);
                return true;
            } catch (error) {
                if (error.status && error.status !== 404) {
                    console.warn(`Failed to delete ${collection}/${assignmentId}`, error);
                }
            }
        }
    }

    for (const action of assignmentDeleteActionCandidates) {
        const url = `${api_url}/${action}`;

        try {
            await requestJson(url, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ planProcedureId, userId, assignmentId }),
            });
            updateStoredAssignments(planProcedureId, cachedIds);
            return true;
        } catch (error) {
            if (error.status && error.status !== 404) {
                console.warn(`Failed to call ${action}`, error);
            }
        }
    }

    updateStoredAssignments(planProcedureId, cachedIds);
    return true;
};

export const clearProcedureAssignments = async (planProcedureId, assignments = []) => {
    for (const action of assignmentClearActionCandidates) {
        const url = `${api_url}/${action}`;

        try {
            await requestJson(url, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ planProcedureId }),
            });
            removeStoredAssignments(planProcedureId);
            return true;
        } catch (error) {
            if (error.status && error.status !== 404) {
                console.warn(`Failed to call ${action}`, error);
            }
        }
    }

    await Promise.all(
        assignments.map((assignment) =>
            deleteProcedureAssignment(planProcedureId, assignment.assignmentId, assignment.userId)
        )
    );

    removeStoredAssignments(planProcedureId);
    return true;
};
