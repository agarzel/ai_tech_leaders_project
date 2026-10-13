"use client";

import { useCallback, useEffect, useState } from "react";
import type { Page, UserDto } from "@devmentor/core";
import { userCreateSchema } from "@devmentor/core/validators/auth/user-create.schema";
import { userUpdateSchema } from "@devmentor/core/validators/auth/user-update.schema";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import { CrudForm, type CrudFormField } from "@devmentor/ui/backend/forms/CrudForm";
import { DataTable, type DataTableColumn } from "@devmentor/ui/backend/tables/DataTable";
import { Badge } from "@devmentor/ui/components/ui/badge";
import { Button } from "@devmentor/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@devmentor/ui/components/ui/card";

const PAGE_SIZE = 10;

const formFields: CrudFormField<typeof userCreateSchema>[] = [
  { name: "name", label: "Name", placeholder: "Ada Lovelace" },
  { name: "email", label: "Email", placeholder: "ada@example.com" },
  { name: "role", label: "Role" },
];

const columns: DataTableColumn<UserDto>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role", cell: (user) => <Badge variant="secondary">{user.role}</Badge> },
  { key: "createdAt", header: "Created", cell: (user) => new Date(user.createdAt).toLocaleDateString("en-GB") },
];

type FormState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; user: UserDto };

export function UsersAdmin() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<UserDto>>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<FormState>({ mode: "closed" });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await apiCall<Page<UserDto>>(`/api/users?page=${page}&pageSize=${PAGE_SIZE}`);
    setIsLoading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setError(null);
    setData(result.data);
  }, [page]);

  useEffect(() => {
    // Fetching on mount/page change is the intended side effect here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function deleteUser(user: UserDto) {
    const result = await apiCall(`/api/users/${user.id}`, { method: "DELETE" });
    setPendingDeleteId(null);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    if (form.mode === "edit" && form.user.id === user.id) setForm({ mode: "closed" });
    await load();
  }

  function closeFormAndReload() {
    setForm({ mode: "closed" });
    void load();
  }

  return (
    <div className="space-y-6">
      {form.mode === "closed" ? (
        <Button onClick={() => setForm({ mode: "create" })}>New user</Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{form.mode === "create" ? "New user" : `Edit ${form.user.name}`}</CardTitle>
          </CardHeader>
          <CardContent>
            {form.mode === "create" ? (
              <CrudForm
                schema={userCreateSchema}
                fields={formFields}
                submitLabel="Create user"
                onSubmit={(values) => apiCall("/api/users", { method: "POST", body: values })}
                onSuccess={closeFormAndReload}
                onCancel={() => setForm({ mode: "closed" })}
              />
            ) : (
              <CrudForm
                key={form.user.id}
                schema={userUpdateSchema}
                fields={formFields}
                initialValues={form.user}
                submitLabel="Save changes"
                onSubmit={(values) => apiCall(`/api/users/${form.user.id}`, { method: "PUT", body: values })}
                onSuccess={closeFormAndReload}
                onCancel={() => setForm({ mode: "closed" })}
              />
            )}
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={columns}
        rows={data?.items}
        getRowId={(user) => user.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => void load()}
        emptyTitle="No users yet"
        emptyDescription="Create the first user with the button above."
        pagination={data && { page: data.page, pageSize: data.pageSize, total: data.total, onPageChange: setPage }}
        rowActions={(user) =>
          pendingDeleteId === user.id ? (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="destructive" aria-label={`Confirm delete ${user.name}`} onClick={() => void deleteUser(user)}>
                Confirm delete
              </Button>
              <Button size="sm" variant="ghost" aria-label={`Keep ${user.name}`} onClick={() => setPendingDeleteId(null)}>
                Keep
              </Button>
            </div>
          ) : (
            <div className="flex justify-end gap-1">
              {/* aria-label: every row has these buttons, so their accessible names must say which user they act on. */}
              <Button size="sm" variant="outline" aria-label={`Edit ${user.name}`} onClick={() => setForm({ mode: "edit", user })}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" aria-label={`Delete ${user.name}`} onClick={() => setPendingDeleteId(user.id)}>
                Delete
              </Button>
            </div>
          )
        }
      />
    </div>
  );
}
