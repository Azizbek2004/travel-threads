"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Alert,
} from "@mui/material";
import {
  Block,
  Delete,
  CheckCircle,
  AdminPanelSettings,
  Report,
  Person,
  PostAdd,
  Event as EventIcon,
  Refresh,
} from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import {
  getUsers,
  blockUser,
  unblockUser,
  deleteUserAccount,
  grantAdminPrivileges,
  revokeAdminPrivileges,
  getReports,
  reviewReport,
  deleteContent,
  getAdminLogs,
  getAdminStats,
} from "../services/admin";

const AdminPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [blockReason, setBlockReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [reportAction, setReportAction] = useState("");

  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      // Check if the user has admin privileges
      if (currentUser.isAdmin) {
        console.log("User is an admin, loading admin data");
        setIsAdmin(true);
        loadTabData(tabValue);
      } else {
        console.log("User is not an admin, redirecting to home");
        setError("You don't have admin privileges");
        setIsAdmin(false);
        navigate("/");
      }
    };

    checkAdminStatus();
  }, [currentUser, navigate]);

  const loadTabData = async (tab: number) => {
    setLoading(true);
    setError(null);

    try {
      switch (tab) {
        case 0: // Dashboard
          const statsData = await getAdminStats();
          setStats(statsData);
          break;
        case 1: // Users
          const usersData = await getUsers();
          setUsers(usersData);
          break;
        case 2: // Reports
          const reportsData = await getReports();
          setReports(reportsData);
          break;
        case 3: // Logs
          const logsData = await getAdminLogs();
          setLogs(logsData);
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    loadTabData(newValue);
  };

  // User management functions
  const handleBlockUser = async () => {
    if (!selectedUser || !blockReason) return;

    try {
      await blockUser(selectedUser.id, currentUser?.uid || "", blockReason);

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id
            ? { ...user, isBlocked: true, blockReason }
            : user
        )
      );

      setSuccess(`User ${selectedUser.displayName} has been blocked`);
      setBlockDialogOpen(false);
      setBlockReason("");
    } catch (error) {
      console.error("Error blocking user:", error);
      setError("Failed to block user");
    }
  };

  const handleUnblockUser = async (user: any) => {
    try {
      await unblockUser(user.id, currentUser?.uid || "");

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === user.id ? { ...u, isBlocked: false, blockReason: null } : u
        )
      );

      setSuccess(`User ${user.displayName} has been unblocked`);
    } catch (error) {
      console.error("Error unblocking user:", error);
      setError("Failed to unblock user");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUserAccount(selectedUser.id, currentUser?.uid || "");

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== selectedUser.id)
      );

      setSuccess(`User ${selectedUser.displayName} has been deleted`);
      setDeleteDialogOpen(false);
      setDeleteReason("");
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user");
    }
  };

  const handleToggleAdmin = async (user: any) => {
    try {
      if (user.isAdmin) {
        await revokeAdminPrivileges(user.id, currentUser?.uid || "");
      } else {
        await grantAdminPrivileges(user.id, currentUser?.uid || "");
      }

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === user.id ? { ...u, isAdmin: !u.isAdmin } : u
        )
      );

      setSuccess(
        `Admin privileges ${user.isAdmin ? "revoked from" : "granted to"} ${
          user.displayName
        }`
      );
    } catch (error) {
      console.error("Error toggling admin status:", error);
      setError("Failed to update admin status");
    }
  };

  // Report management functions
  const handleReviewReport = async (status: "resolved" | "dismissed") => {
    if (!selectedReport) return;

    try {
      await reviewReport(
        selectedReport.id,
        currentUser?.uid || "",
        status,
        reportAction
      );

      // If resolving and taking action to delete content
      if (status === "resolved" && reportAction.includes("delete")) {
        await deleteContent(
          selectedReport.entityId,
          selectedReport.entityType,
          currentUser?.uid || "",
          `Reported content removed: ${selectedReport.reason}`
        );
      }

      // Update local state
      setReports((prevReports) =>
        prevReports.map((report) =>
          report.id === selectedReport.id
            ? { ...report, status, reviewedBy: currentUser?.uid }
            : report
        )
      );

      setSuccess(`Report has been ${status}`);
      setReportDialogOpen(false);
      setReportAction("");
    } catch (error) {
      console.error("Error reviewing report:", error);
      setError("Failed to review report");
    }
  };

  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If not admin, redirect to home
  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Dashboard" />
          <Tab label="Users" />
          <Tab label="Reports" />
          <Tab label="Logs" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Dashboard Tab */}
          {tabValue === 0 && stats && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Users
                    </Typography>
                    <Typography variant="h4">{stats.totalUsers}</Typography>
                    <Typography variant="body2" color="error">
                      {stats.blockedUsers} blocked
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Content
                    </Typography>
                    <Typography variant="h4">
                      {stats.totalPosts + stats.totalEvents}
                    </Typography>
                    <Typography variant="body2">
                      {stats.totalPosts} posts, {stats.totalEvents} events
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Pending Reports
                    </Typography>
                    <Typography variant="h4">{stats.pendingReports}</Typography>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => {
                        setTabValue(2);
                        loadTabData(2);
                      }}
                    >
                      View Reports
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Typography variant="h6">Recent Activity</Typography>
                      <Button
                        startIcon={<Refresh />}
                        size="small"
                        onClick={() => loadTabData(0)}
                      >
                        Refresh
                      </Button>
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Action</TableCell>
                            <TableCell>Admin</TableCell>
                            <TableCell>Target</TableCell>
                            <TableCell>Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {logs.slice(0, 5).map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>
                                {log.action.replace(/_/g, " ")}
                              </TableCell>
                              <TableCell>{log.adminId}</TableCell>
                              <TableCell>
                                {log.userId || log.entityId || "N/A"}
                              </TableCell>
                              <TableCell>
                                {log.timestamp &&
                                  new Date(
                                    log.timestamp.toDate()
                                  ).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Users Tab */}
          {tabValue === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Posts</TableCell>
                    <TableCell>Reports</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar src={user.photoURL} sx={{ mr: 2 }}>
                            {user.displayName?.charAt(0) || "U"}
                          </Avatar>
                          <Box>
                            <Typography variant="body1">
                              {user.displayName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.isAdmin && (
                          <Chip
                            size="small"
                            icon={<AdminPanelSettings />}
                            label="Admin"
                            color="primary"
                            sx={{ mr: 1 }}
                          />
                        )}
                        {user.isBlocked ? (
                          <Chip
                            size="small"
                            icon={<Block />}
                            label="Blocked"
                            color="error"
                            title={user.blockReason}
                          />
                        ) : (
                          <Chip
                            size="small"
                            icon={<CheckCircle />}
                            label="Active"
                            color="success"
                          />
                        )}
                      </TableCell>
                      <TableCell>{user.threadCount || 0}</TableCell>
                      <TableCell>{user.reportCount || 0}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex" }}>
                          {user.isBlocked ? (
                            <IconButton
                              color="primary"
                              title="Unblock User"
                              onClick={() => handleUnblockUser(user)}
                            >
                              <CheckCircle />
                            </IconButton>
                          ) : (
                            <IconButton
                              color="warning"
                              title="Block User"
                              onClick={() => {
                                setSelectedUser(user);
                                setBlockDialogOpen(true);
                              }}
                            >
                              <Block />
                            </IconButton>
                          )}

                          <IconButton
                            color={user.isAdmin ? "default" : "primary"}
                            title={user.isAdmin ? "Revoke Admin" : "Make Admin"}
                            onClick={() => handleToggleAdmin(user)}
                          >
                            <AdminPanelSettings />
                          </IconButton>

                          <IconButton
                            color="error"
                            title="Delete User"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Reports Tab */}
          {tabValue === 2 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Reporter</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.reporterId}</TableCell>
                      <TableCell>
                        {report.entityType === "post" && (
                          <PostAdd fontSize="small" sx={{ mr: 0.5 }} />
                        )}
                        {report.entityType === "event" && (
                          <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
                        )}
                        {report.entityType === "user" && (
                          <Person fontSize="small" sx={{ mr: 0.5 }} />
                        )}
                        {report.entityType}
                      </TableCell>
                      <TableCell>{report.reason}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={report.status}
                          color={
                            report.status === "pending"
                              ? "warning"
                              : report.status === "resolved"
                              ? "success"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {report.createdAt &&
                          new Date(report.createdAt.toDate()).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {report.status === "pending" && (
                          <Box sx={{ display: "flex" }}>
                            <IconButton
                              color="primary"
                              title="Review Report"
                              onClick={() => {
                                setSelectedReport(report);
                                setReportDialogOpen(true);
                              }}
                            >
                              <Report />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Logs Tab */}
          {tabValue === 3 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.action.replace(/_/g, " ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Logs Tab */}
          {tabValue === 3 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell>Admin</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.action.replace(/_/g, " ")}</TableCell>
                      <TableCell>{log.adminId}</TableCell>
                      <TableCell>
                        {log.userId && (
                          <Typography variant="body2">
                            User: {log.userId}
                          </Typography>
                        )}
                        {log.entityId && (
                          <Typography variant="body2">
                            {log.entityType}: {log.entityId}
                          </Typography>
                        )}
                        {log.reason && (
                          <Typography variant="body2">
                            Reason: {log.reason}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.timestamp &&
                          new Date(log.timestamp.toDate()).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Block User Dialog */}
      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)}>
        <DialogTitle>Block User</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to block {selectedUser?.displayName}?
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for blocking"
            fullWidth
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBlockUser}
            color="error"
            disabled={!blockReason}
          >
            Block User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography gutterBottom color="error">
            Warning: This action cannot be undone. All user data will be
            permanently deleted.
          </Typography>
          <Typography gutterBottom>
            Are you sure you want to delete {selectedUser?.displayName}?
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason for deletion"
            fullWidth
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            disabled={!deleteReason}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      >
        <DialogTitle>Review Report</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Report Details
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Type:</strong> {selectedReport?.entityType}
          </Typography>
          <Typography variant="body2" gutterBottom>
            <strong>Reason:</strong> {selectedReport?.reason}
          </Typography>
          {selectedReport?.description && (
            <Typography variant="body2" gutterBottom>
              <strong>Description:</strong> {selectedReport.description}
            </Typography>
          )}
          <Divider sx={{ my: 2 }} />
          <TextField
            margin="dense"
            label="Action taken"
            fullWidth
            value={reportAction}
            onChange={(e) => setReportAction(e.target.value)}
            placeholder="e.g., 'Content deleted', 'Warning issued', etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleReviewReport("dismissed")}
            color="primary"
          >
            Dismiss
          </Button>
          <Button onClick={() => handleReviewReport("resolved")} color="error">
            Resolve & Take Action
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;
