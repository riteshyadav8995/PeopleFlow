const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

const newModels = `
// ─── SELF SERVICE PORTAL ────────────────────

model Notification {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  userId         String    @map("user_id")
  title          String
  message        String    @db.Text
  type           String    @default("INFO") // INFO | ALERT | SUCCESS | WARNING
  isRead         Boolean   @default(false) @map("is_read")
  link           String?
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([organizationId])
  @@index([userId])
  @@map("notifications")
}

model Holiday {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  name           String
  date           DateTime  @db.Date
  type           String    @default("PUBLIC") // PUBLIC | OPTIONAL | COMPANY
  description    String?
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@index([tenantId])
  @@index([organizationId])
  @@map("holidays")
}

model Announcement {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  title          String
  content        String    @db.Text
  priority       String    @default("NORMAL") // LOW | NORMAL | HIGH | URGENT
  authorId       String?   @map("author_id")
  expiryDate     DateTime? @map("expiry_date")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@index([tenantId])
  @@index([organizationId])
  @@map("announcements")
}

model Document {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  employeeId     String    @map("employee_id")
  name           String
  fileUrl        String    @map("file_url")
  type           String    @default("OTHER") // ID | CONTRACT | PAYSLIP | POLICY | OTHER
  uploadDate     DateTime  @default(now()) @map("upload_date")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  employee Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([organizationId])
  @@index([employeeId])
  @@map("documents")
}

model Meeting {
  id             String    @id @default(uuid())
  tenantId       String    @map("tenant_id")
  organizationId String    @map("organization_id")
  organizerId    String    @map("organizer_id") // Employee ID
  title          String
  description    String?   @db.Text
  startTime      DateTime  @map("start_time")
  endTime        DateTime  @map("end_time")
  meetLink       String?   @map("meet_link")
  googleEventId  String?   @map("google_event_id")
  attendees      Json?     // Array of email strings or employee IDs
  status         String    @default("SCHEDULED") // SCHEDULED | CANCELLED | COMPLETED
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  @@index([tenantId])
  @@index([organizationId])
  @@index([organizerId])
  @@map("meetings")
}
`;

if (!schemaContent.includes('model Notification')) {
  schemaContent += newModels;

  // Inject reverse relations
  schemaContent = schemaContent.replace(
    '  loginAttempts    LoginAttempt[]',
    '  loginAttempts    LoginAttempt[]\n  notifications    Notification[]'
  );

  schemaContent = schemaContent.replace(
    '  voiceCallLogs   VoiceCallLog[]',
    '  voiceCallLogs   VoiceCallLog[]\n  documents       Document[]'
  );

  fs.writeFileSync(schemaPath, schemaContent, 'utf8');
  console.log('Appended models to schema.prisma successfully.');
} else {
  console.log('Models already exist in schema.prisma.');
}
