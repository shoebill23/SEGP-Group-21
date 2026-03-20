import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserManagement } from "@/hooks/useUserManagement";
import { UserRole } from "@/contexts/AuthContext";
import { Trash2, Edit2, Plus } from "lucide-react";

const ROLES: UserRole[] = ["Admin", "Manager", "Worker"];

interface FormData {
  email: string;
  name: string;
  role: UserRole;
}

const Users = () => {
  const { users, addUser, updateUser, deleteUser } = useUserManagement();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    email: "",
    name: "",
    role: "Worker",
  });

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.role) {
      errors.role = "Role is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handle adding a new user
   */
  const handleAddUser = () => {
    if (!validateForm()) return;

    addUser({
      email: formData.email.trim(),
      name: formData.name.trim(),
      role: formData.role,
    });

    setFormData({ email: "", name: "", role: "Worker" });
    setIsAddDialogOpen(false);
  };

  /**
   * Open edit dialog with user data
   */
  const handleEditClick = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setFormData({
        email: user.email,
        name: user.name,
        role: user.role,
      });
      setEditingUserId(userId);
      setIsEditDialogOpen(true);
    }
  };

  /**
   * Handle updating user
   */
  const handleUpdateUser = () => {
    if (!validateForm() || !editingUserId) return;

    updateUser(editingUserId, {
      email: formData.email.trim(),
      name: formData.name.trim(),
      role: formData.role,
    });

    setFormData({ email: "", name: "", role: "Worker" });
    setEditingUserId(null);
    setIsEditDialogOpen(false);
  };

  /**
   * Open delete confirmation
   */
  const handleDeleteClick = (userId: string) => {
    setDeleteUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  /**
   * Confirm delete
   */
  const handleConfirmDelete = () => {
    if (deleteUserId) {
      deleteUser(deleteUserId);
      setDeleteUserId(null);
      setIsDeleteDialogOpen(false);
    }
  };

  /**
   * Close dialogs and reset form
   */
  const closeAddDialog = () => {
    setIsAddDialogOpen(false);
    setFormData({ email: "", name: "", role: "Worker" });
    setFormErrors({});
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingUserId(null);
    setFormData({ email: "", name: "", role: "Worker" });
    setFormErrors({});
  };

  /**
   * Get role badge variant
   */
  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "Admin":
        return "destructive" as const;
      case "Manager":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  /**
   * Get user count by role
   */
  const getUserCountByRole = (role: UserRole) => {
    return users.filter((u) => u.role === role).length;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage system users, assign roles, and control access levels
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {ROLES.map((role) => (
          <Card key={role}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{getUserCountByRole(role)}</div>
                <div className="text-sm text-muted-foreground">{role} Users</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No users found</p>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
                Create First User
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(user.id)}
                            className="gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(user.id)}
                            className="gap-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account and assign a role
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="add-email">Email Address</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name</Label>
              <Input
                id="add-name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Role Select */}
            <div className="space-y-2">
              <Label htmlFor="add-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                <SelectTrigger id="add-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-500">{formErrors.role}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAddDialog}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and role</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Role Select */}
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}>
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.role && (
                <p className="text-sm text-red-500">{formErrors.role}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Users;
