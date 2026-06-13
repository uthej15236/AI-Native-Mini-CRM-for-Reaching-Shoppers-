import type { RequestHandler } from "express";
import type { SortOrder } from "mongoose";
import { Parser } from "json2csv";
import { LEADS_PAGE_SIZE, type LeadSource, type LeadStatus } from "../constants/leads";
import { Lead } from "../models/Lead";
import { AppError } from "../utils/appError";
import { asyncHandler } from "../utils/asyncHandler";

type LeadListQuery = {
  page?: string;
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
  sort?: "latest" | "oldest";
};

type LeadListFilter = {
  status?: LeadStatus;
  source?: LeadSource;
  $or?: Array<{ name?: { $regex: string; $options: string }; email?: { $regex: string; $options: string } }>;
};

const buildLeadFilters = (query: LeadListQuery): LeadListFilter => {
  const filter: LeadListFilter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.source) {
    filter.source = query.source;
  }

  const search = query.search?.trim();
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  return filter;
};

export const createLead: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const { name, email, status, source } = req.body as {
    name: string;
    email: string;
    status?: LeadStatus;
    source: LeadSource;
  };

  const lead = await Lead.create({
    name,
    email,
    status: status ?? "New",
    source,
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: "Lead created successfully",
    data: lead,
  });
});

export const getLeads: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as LeadListQuery;
  const page = Math.max(Number(query.page ?? "1"), 1);
  const skip = (page - 1) * LEADS_PAGE_SIZE;
  const sortDirection: SortOrder = query.sort === "oldest" ? 1 : -1;

  const filter = buildLeadFilters(query);
  const [leads, totalRecords] = await Promise.all([
    Lead.find(filter).sort({ createdAt: sortDirection }).skip(skip).limit(LEADS_PAGE_SIZE),
    Lead.countDocuments(filter),
  ]);

  const totalPages = Math.max(Math.ceil(totalRecords / LEADS_PAGE_SIZE), 1);

  res.status(200).json({
    success: true,
    data: leads,
    meta: {
      page,
      limit: LEADS_PAGE_SIZE,
      totalRecords,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      sort: query.sort ?? "latest",
      filters: {
        status: query.status ?? null,
        source: query.source ?? null,
        search: query.search?.trim() ?? null,
      },
    },
  });
});

export const getLeadById: RequestHandler = asyncHandler(async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  res.status(200).json({
    success: true,
    data: lead,
  });
});

export const updateLead: RequestHandler = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Lead updated successfully",
    data: lead,
  });
});

export const deleteLead: RequestHandler = asyncHandler(async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) {
    throw new AppError("Lead not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Lead deleted successfully",
  });
});

export const exportLeadsCsv: RequestHandler = asyncHandler(async (req, res) => {
  const query = req.query as LeadListQuery;
  const sortDirection: SortOrder = query.sort === "oldest" ? 1 : -1;
  const filter = buildLeadFilters(query);

  const leads = await Lead.find(filter).sort({ createdAt: sortDirection });

  const parser = new Parser<{
    name: string;
    email: string;
    status: string;
    source: string;
    createdAt: string;
  }>({
    fields: ["name", "email", "status", "source", "createdAt"],
  });

  const csv = parser.parse(
    leads.map((lead) => ({
      name: lead.name,
      email: lead.email,
      status: lead.status,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
    }))
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=leads.csv");
  res.status(200).send(csv);
});
