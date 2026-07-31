const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

const newModels = `
// ─── RECRUITMENT (Phase 6) ──────────────────

model JobRequisition {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  title          String
  departmentId   String?   @map("department_id")
  designationId  String?   @map("designation_id")
  branchId       String?   @map("branch_id")
  hiringManagerId String?  @map("hiring_manager_id")
  recruiterId    String?   @map("recruiter_id")
  positions      Int
  employmentType String    @map("employment_type")
  workMode       String    @map("work_mode")
  experienceMin  Int?      @map("experience_min")
  experienceMax  Int?      @map("experience_max")
  salaryRangeMin Float?    @map("salary_range_min")
  salaryRangeMax Float?    @map("salary_range_max")
  expectedJoinDate DateTime? @map("expected_join_date")
  reason         String?
  jobDescription String?   @map("job_description")
  status         String    @default("DRAFT") // DRAFT | SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | CANCELLED | CONVERTED_TO_JOB
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@index([tenantId])
  @@index([organizationId])
  @@map("job_requisitions")
}

model JobOpening {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  requisitionId  String?   @map("requisition_id")
  jobCode        String    @map("job_code")
  title          String
  departmentId   String?   @map("department_id")
  designationId  String?   @map("designation_id")
  branchId       String?   @map("branch_id")
  hiringManagerId String?  @map("hiring_manager_id")
  recruiterId    String?   @map("recruiter_id")
  positions      Int
  employmentType String    @map("employment_type")
  workMode       String    @map("work_mode")
  experienceMin  Int?      @map("experience_min")
  experienceMax  Int?      @map("experience_max")
  salaryVisible  Boolean   @default(false) @map("salary_visible")
  publicDescription String? @map("public_description")
  internalNotes  String?   @map("internal_notes")
  applicationDeadline DateTime? @map("application_deadline")
  status         String    @default("DRAFT") // DRAFT | PENDING_APPROVAL | APPROVED | PUBLISHED | PAUSED | CLOSED | CANCELLED | ARCHIVED
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  applications   Application[]
  interviews     Interview[]

  @@index([tenantId])
  @@index([organizationId])
  @@map("job_openings")
}

model Candidate {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  userId         String?   @unique @map("user_id") // For Candidate Portal login
  firstName      String    @map("first_name")
  lastName       String    @map("last_name")
  email          String
  phone          String?
  resumeUrl      String?   @map("resume_url")
  portfolioUrl   String?   @map("portfolio_url")
  totalExperience Float?   @map("total_experience")
  currentCompany String?   @map("current_company")
  currentSalary  Float?    @map("current_salary")
  expectedSalary Float?    @map("expected_salary")
  noticePeriod   Int?      @map("notice_period") // in days
  status         String    @default("ACTIVE")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  applications   Application[]
  interviews     Interview[]

  @@unique([tenantId, organizationId, email])
  @@index([tenantId])
  @@index([organizationId])
  @@map("candidates")
}

model Application {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  candidateId    String    @map("candidate_id")
  jobId          String    @map("job_id")
  stage          String    @default("APPLIED") // APPLIED | SCREENING | SHORTLISTED | INTERVIEW | OFFER | HIRED | REJECTED
  status         String    @default("ACTIVE") // ACTIVE | WITHDRAWN
  source         String?
  appliedAt      DateTime  @default(now()) @map("applied_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  candidate      Candidate  @relation(fields: [candidateId], references: [id])
  job            JobOpening @relation(fields: [jobId], references: [id])
  interviews     Interview[]

  @@unique([candidateId, jobId])
  @@index([tenantId])
  @@index([organizationId])
  @@map("applications")
}

model Interview {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  candidateId    String    @map("candidate_id")
  applicationId  String    @map("application_id")
  jobId          String    @map("job_id")
  roundName      String    @map("round_name")
  interviewType  String    @map("interview_type") // technical, hr, behavioral
  interviewMode  String    @map("interview_mode") // online, offline
  scheduledAt    DateTime  @map("scheduled_at")
  duration       Int       // minutes
  meetingLink    String?   @map("meeting_link")
  status         String    @default("SCHEDULED") // SCHEDULED | CONFIRMED | COMPLETED | CANCELLED | NO_SHOW
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  candidate      Candidate   @relation(fields: [candidateId], references: [id])
  application    Application @relation(fields: [applicationId], references: [id])
  job            JobOpening  @relation(fields: [jobId], references: [id])
  feedback       InterviewFeedback[]

  @@index([tenantId])
  @@index([organizationId])
  @@map("interviews")
}

model InterviewFeedback {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  interviewId    String    @map("interview_id")
  interviewerId  String    @map("interviewer_id")
  rating         Int?
  recommendation String?   // STRONG_HIRE, HIRE, REJECT
  feedback       String?
  status         String    @default("PENDING") // PENDING | SUBMITTED
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  interview      Interview @relation(fields: [interviewId], references: [id])
  
  @@unique([interviewId, interviewerId])
  @@map("interview_feedback")
}

// ─── ONBOARDING (Phase 7) ───────────────────

model OnboardingTemplate {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  name           String
  description    String?
  isActive       Boolean   @default(true) @map("is_active")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  tasks          OnboardingTaskTemplate[]
  workflows      OnboardingWorkflow[]

  @@index([tenantId])
  @@index([organizationId])
  @@map("onboarding_templates")
}

model OnboardingTaskTemplate {
  id             String    @id @default(uuid())
  templateId     String    @map("template_id")
  title          String
  category       String    // EMPLOYEE | HR | MANAGER | IT
  isMandatory    Boolean   @default(true) @map("is_mandatory")
  dueDaysOffset  Int       @default(0) @map("due_days_offset")
  createdAt      DateTime  @default(now()) @map("created_at")

  template       OnboardingTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  @@map("onboarding_task_templates")
}

model OnboardingWorkflow {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  templateId     String    @map("template_id")
  employeeId     String    @map("employee_id")
  status         String    @default("IN_PROGRESS") // NOT_STARTED | IN_PROGRESS | COMPLETED | BLOCKED
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  template       OnboardingTemplate @relation(fields: [templateId], references: [id])
  tasks          OnboardingTask[]

  @@index([tenantId])
  @@index([organizationId])
  @@map("onboarding_workflows")
}

model OnboardingTask {
  id             String    @id @default(uuid())
  workflowId     String    @map("workflow_id")
  title          String
  category       String
  isMandatory    Boolean   @map("is_mandatory")
  status         String    @default("PENDING") // PENDING | COMPLETED | WAIVED
  assigneeId     String?   @map("assignee_id")
  dueDate        DateTime? @map("due_date")
  completedAt    DateTime? @map("completed_at")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  workflow       OnboardingWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@map("onboarding_tasks")
}

// ─── ADVANCED PAYROLL (Phase 8) ─────────────

model PayrollGroup {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  name           String
  description    String?
  payFrequency   String    @default("MONTHLY") @map("pay_frequency")
  currency       String    @default("USD")
  isActive       Boolean   @default(true) @map("is_active")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  periods        PayrollPeriod[]
  runs           PayrollRun[]

  @@index([tenantId])
  @@index([organizationId])
  @@map("payroll_groups")
}

model SalaryComponent {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  name           String
  code           String
  type           String    // EARNING | DEDUCTION | REIMBURSEMENT
  isTaxable      Boolean   @default(true) @map("is_taxable")
  calculationType String   @default("FIXED") @map("calculation_type") // FIXED | FORMULA
  formula        String?
  isActive       Boolean   @default(true) @map("is_active")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@unique([tenantId, organizationId, code])
  @@map("salary_components")
}

model PayrollPeriod {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  groupId        String    @map("group_id")
  name           String
  startDate      DateTime  @db.Date @map("start_date")
  endDate        DateTime  @db.Date @map("end_date")
  status         String    @default("OPEN") // OPEN | CLOSED | ARCHIVED
  createdAt      DateTime  @default(now()) @map("created_at")

  group          PayrollGroup @relation(fields: [groupId], references: [id])
  runs           PayrollRun[]

  @@index([tenantId])
  @@index([organizationId])
  @@map("payroll_periods")
}

model PayrollRun {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  periodId       String    @map("period_id")
  groupId        String    @map("group_id")
  status         String    @default("DRAFT") // DRAFT | CALCULATED | APPROVED | LOCKED | PAID
  processedBy    String?   @map("processed_by")
  approvedBy     String?   @map("approved_by")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  period         PayrollPeriod @relation(fields: [periodId], references: [id])
  group          PayrollGroup  @relation(fields: [groupId], references: [id])
  exceptions     PayrollException[]

  @@index([tenantId])
  @@index([organizationId])
  @@map("payroll_runs")
}

model PayrollException {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  runId          String    @map("run_id")
  employeeId     String?   @map("employee_id")
  severity       String    // WARNING | CRITICAL
  message        String
  isResolved     Boolean   @default(false) @map("is_resolved")
  createdAt      DateTime  @default(now()) @map("created_at")

  run            PayrollRun @relation(fields: [runId], references: [id], onDelete: Cascade)

  @@index([runId])
  @@map("payroll_exceptions")
}
`;

if (!schemaContent.includes('model JobRequisition')) {
  fs.writeFileSync(schemaPath, schemaContent + '\n' + newModels);
  console.log('Appended successfully');
} else {
  console.log('Already appended');
}
