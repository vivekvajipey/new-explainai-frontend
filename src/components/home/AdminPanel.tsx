// src/components/home/AdminPanel.tsx
interface ApprovedUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  last_login: string | null;
}

interface AdminPanelProps {
  approvedUsers: ApprovedUser[];
  newApprovalEmail: string;
  setNewApprovalEmail: (email: string) => void;
  isLoadingApprovedUsers: boolean;
  onApproveUser: () => Promise<void>;
  onRemoveApproval: (email: string) => Promise<void>;
}

export function AdminPanel({
  approvedUsers,
  newApprovalEmail,
  setNewApprovalEmail,
  isLoadingApprovedUsers,
  onApproveUser,
  onRemoveApproval
}: AdminPanelProps) {
  return (
    <section className="px-4 mt-8">
      <div className="bg-card-bg backdrop-blur-lg rounded-3xl p-8 max-w-3xl mx-auto 
                    border border-card-border">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Admin Controls</h2>
          <p className="text-sand-600 dark:text-sand-400 mt-1">Manage user approvals</p>
        </div>

        {/* Add User Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Approve New User
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={newApprovalEmail}
                onChange={(e) => setNewApprovalEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 px-4 py-2 rounded-lg border border-input-border 
                         bg-input-bg text-input-text focus:ring-2 focus:ring-input-focus"
              />
              <button 
                onClick={onApproveUser}
                disabled={!newApprovalEmail}
                className="px-4 py-2 bg-button-analyze-bg text-button-analyze-text 
                         rounded-lg hover:bg-button-analyze-hover disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>

          {/* Approved Users List */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-3">Approved Users</h3>
            <div className="space-y-2">
              {isLoadingApprovedUsers ? (
                <p className="text-sand-600 dark:text-sand-400">Loading...</p>
              ) : approvedUsers.length > 0 ? (
                approvedUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-input-bg rounded-lg">
                    <div>
                      <p className="text-foreground font-medium">{user.email}</p>
                      <p className="text-sm text-sand-600 dark:text-sand-400">
                        {user.name} - Last login: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <button 
                      onClick={() => onRemoveApproval(user.email)}
                      className="text-error hover:text-rose-700 text-sm"
                    >
                      Remove Approval
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sand-600 dark:text-sand-400">No approved users found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}