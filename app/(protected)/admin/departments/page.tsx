import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { listDepartments } from '@/services/admin-service'
import { DepartmentForm } from '@/components/admin/department-form'
import { DepartmentsTable } from '@/components/admin/departments-table'
import { PageHeader } from '@/components/ui/page-header'

// Reads the session cookie on every request — blocking route (cacheComponents).
export const instant = false

// /admin/departments — create, rename, archive and delete departments.
// Middleware 403s non-admins; this re-check is defense-in-depth.
export default async function AdminDepartmentsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/dashboard')

  const departments = await listDepartments(session)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Departments group users, budgets and expenses. Archive one to retire it while keeping its name in historical reports; a permanent delete is only allowed once nothing references it."
      />

      <DepartmentForm />

      <DepartmentsTable departments={departments} />
    </div>
  )
}
