import { call } from "../utils/api.js";

// Auth
export const loginApi        = (username, password) => call("login", { username, password });

// Dashboard
export const getFieldDashboard = () => call("getFieldDashboard");

// Check-in / out
export const getTodayStatus  = () => call("getFieldTodayStatus");
export const checkInApi      = (params) => call("checkIn", params);
export const checkOutApi     = (params) => call("checkOut", params);

// Activities
export const getActivities   = (params) => call("getFieldActivities", params);
export const addActivity     = (params) => call("addFieldActivity", params);
export const updateActivity  = (params) => call("updateFieldActivity", params);

// Field Leads
export const getFieldLeads   = (params) => call("getFieldLeads", params);
export const addFieldLead    = (params) => call("addFieldLeads", params);

// Expenses
export const getExpenses     = (params) => call("getFieldExpenses", params);
export const addExpense      = (params) => call("addFieldExpense", params);

// Targets
export const getTargets      = (params) => call("getFieldTargets", params);
export const setTarget       = (params) => call("setFieldTarget", params);

// Venues
export const getVenues       = () => call("getFieldVenues");
export const addVenue        = (params) => call("addFieldVenue", params);
export const updateVenue     = (params) => call("updateFieldVenue", params);
export const setVenueLocation = (params) => call("setVenueLocation", params);

// Sessions (admin)
export const getSessions     = (params) => call("getFieldSessions", params);

// Trail
export const recordTrail     = (params) => call("recordTrailPoints", params);
export const getTrail        = (params) => call("getProTrail", params);

// Users (for admin dropdowns)
export const getUsers        = () => call("getUsers");
