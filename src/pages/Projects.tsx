import React, { useState } from 'react';
import { useStore, Project, CollaboratorSplit } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Users, PieChart } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

export function Projects() {
  const { projects, clients, invoices, addProject, updateProject, deleteProject } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingSplitProject, setViewingSplitProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    location: '',
    date: '',
    description: '',
  });
  const [collaborators, setCollaborators] = useState<CollaboratorSplit[]>([]);

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        title: project.title,
        clientId: project.clientId,
        location: project.location,
        date: project.date,
        description: project.description,
      });
      setCollaborators(project.collaborators || []);
    } else {
      setEditingProject(null);
      setFormData({ title: '', clientId: '', location: '', date: '', description: '' });
      setCollaborators([]);
    }
    setIsDialogOpen(true);
  };

  const handleOpenSplitDialog = (project: Project) => {
    setViewingSplitProject(project);
    setIsSplitDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await updateProject(editingProject.id, { ...formData, collaborators });
      } else {
        await addProject({
          id: crypto.randomUUID(),
          ...formData,
          collaborators,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project. Please check your connection and try again.");
    }
  };

  const addCollaborator = () => {
    setCollaborators([...collaborators, { id: crypto.randomUUID(), name: '', splitType: 'equal' }]);
  };

  const updateCollaborator = (id: string, field: keyof CollaboratorSplit, value: any) => {
    setCollaborators(collaborators.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCollaborator = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
  };

  const calculateSplit = (project: Project) => {
    const projectInvoices = invoices.filter(i => i.projectId === project.id);
    const totalRevenue = projectInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
    
    if (totalRevenue === 0 || !project.collaborators || project.collaborators.length === 0) {
      return [];
    }

    const equalSplitCount = project.collaborators.filter(c => c.splitType === 'equal').length;
    const percentageCollaborators = project.collaborators.filter(c => c.splitType === 'percentage');
    
    let totalPercentageAllocated = percentageCollaborators.reduce((sum, c) => sum + (c.percentage || 0), 0);
    
    // Ensure we don't exceed 100%
    if (totalPercentageAllocated > 100) totalPercentageAllocated = 100;
    
    const remainingPercentageForEqual = 100 - totalPercentageAllocated;
    const equalPercentage = equalSplitCount > 0 ? remainingPercentageForEqual / equalSplitCount : 0;

    return project.collaborators.map(c => {
      const percentage = c.splitType === 'percentage' ? (c.percentage || 0) : equalPercentage;
      const amount = (totalRevenue * percentage) / 100;
      return { ...c, calculatedPercentage: percentage, amount };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto" />}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Malindi"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-base">Collaborators</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCollaborator}>
                    <Users className="w-4 h-4 mr-2" />
                    Add Collaborator
                  </Button>
                </div>
                
                {collaborators.length > 0 && (
                  <div className="space-y-3">
                    {collaborators.map((collab) => (
                      <div key={collab.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-md border">
                        <div className="flex-1">
                          <Input
                            placeholder="Collaborator Name"
                            value={collab.name}
                            onChange={(e) => updateCollaborator(collab.id, 'name', e.target.value)}
                            required
                          />
                        </div>
                        <div className="w-32">
                          <Select
                            value={collab.splitType}
                            onValueChange={(value) => updateCollaborator(collab.id, 'splitType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="equal">Equal Split</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {collab.splitType === 'percentage' && (
                          <div className="w-24">
                            <Input
                              type="number"
                              placeholder="%"
                              min="0"
                              max="100"
                              value={collab.percentage || ''}
                              onChange={(e) => updateCollaborator(collab.id, 'percentage', Number(e.target.value))}
                              required
                            />
                          </div>
                        )}
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeCollaborator(collab.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {editingProject ? 'Update Project' : 'Save Project'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isSplitDialogOpen} onOpenChange={setIsSplitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revenue Split: {viewingSplitProject?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {viewingSplitProject && (!viewingSplitProject.collaborators || viewingSplitProject.collaborators.length === 0) ? (
              <p className="text-muted-foreground text-center py-4">No collaborators assigned to this project.</p>
            ) : viewingSplitProject && invoices.filter(i => i.projectId === viewingSplitProject.id).reduce((sum, i) => sum + i.amountPaid, 0) === 0 ? (
              <p className="text-muted-foreground text-center py-4">No revenue recorded for this project yet.</p>
            ) : viewingSplitProject ? (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border flex justify-between items-center">
                  <span className="font-medium">Total Project Revenue</span>
                  <span className="text-xl font-bold text-primary">
                    KES {invoices.filter(i => i.projectId === viewingSplitProject.id).reduce((sum, i) => sum + i.amountPaid, 0).toLocaleString()}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <Table className="min-w-[400px]">
                    <TableHeader>
                    <TableRow>
                      <TableHead>Collaborator</TableHead>
                      <TableHead>Share</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculateSplit(viewingSplitProject).map((split, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{split.name}</TableCell>
                        <TableCell>{split.calculatedPercentage.toFixed(1)}%</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          KES {split.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Collaborators</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No projects found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                [...projects].sort((a, b) => {
                  const dateA = new Date(a.date).getTime();
                  const dateB = new Date(b.date).getTime();
                  if (dateB !== dateA) return dateB - dateA;
                  return b.id.localeCompare(a.id);
                }).map((project) => {
                  const client = clients.find(c => c.id === project.clientId);
                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.title}</TableCell>
                      <TableCell>{client?.name || 'Unknown Client'}</TableCell>
                      <TableCell>{project.location}</TableCell>
                      <TableCell>{project.date ? format(new Date(project.date), 'MMM d, yyyy') : '-'}</TableCell>
                      <TableCell>{project.collaborators?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenSplitDialog(project)} className="mr-2">
                          <PieChart className="w-4 h-4 mr-1" /> Split
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(project)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setProjectToDelete(project.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        onConfirm={() => {
          if (projectToDelete) {
            deleteProject(projectToDelete);
            setProjectToDelete(null);
          }
        }}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
      />
    </div>
  );
}
