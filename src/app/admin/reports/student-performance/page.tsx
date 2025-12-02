"use client";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { StudentPerformanceReport } from "@/components/admin/StudentPerformanceReport";

export default function StudentPerformanceReportPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Student Performance Report
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive view of student progress, achievements, and
            certification status
          </p>
        </div>

        <StudentPerformanceReport />
      </div>
    </AdminLayout>
  );
}
