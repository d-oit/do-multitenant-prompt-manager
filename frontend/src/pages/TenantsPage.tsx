import type { Tenant } from "../types";

interface TenantsPageProps {
  tenants: Tenant[];
}

export default function TenantsPage({ tenants }: TenantsPageProps): JSX.Element {
  return (
    <div className="pm-tenants-page pm-stack">
      <h2>Tenants</h2>
      {tenants.length === 0 ? (
        <p>No tenants have been created yet.</p>
      ) : (
        <ul className="pm-stack pm-stack--sm">
          {tenants.map((tenant) => (
            <li key={tenant.id}>
              <strong>{tenant.name}</strong> <span className="pm-muted">({tenant.slug})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
