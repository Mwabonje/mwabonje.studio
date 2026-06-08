import React, { useState } from 'react';
import { useStore, Project, CollaboratorSplit, Milestone } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Users, PieChart, LayoutList, Clock, CheckSquare } from 'lucide-react';
import { format, isAfter, isBefore, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

export function Projects() {
  const { projects, projectTemplates, clients, invoices, quotes, addProject, updateProject, deleteProject, updateQuote, addProjectTemplate, deleteProjectTemplate } = useStore();
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
        
        // Update associated quotes
        const associatedQuotes = quotes.filter(q => q.projectId === editingProject.id);
        for (const quote of associatedQuotes) {
          const updates: any = {};
          if (formData.date && quote.eventDate !== formData.date) {
            updates.eventDate = formData.date;
          }
          if (formData.title && quote.projectTitle !== formData.title) {
            updates.projectTitle = formData.title;
          }
          if (Object.keys(updates).length > 0) {
            await updateQuote(quote.id, updates);
          }
        }
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

  const handleSaveTemplate = async () => {
    const templateName = prompt("Enter a name for this template:");
    if (!templateName) return;
    
    try {
      await addProjectTemplate({
        id: crypto.randomUUID(),
        name: templateName,
        title: formData.title,
        location: formData.location,
        description: formData.description,
        collaborators,
      });
      toast.success("Template saved successfully.");
    } catch(error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template.");
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = projectTemplates.find(t => t.id === templateId);
    if (!template) return;
    
    setFormData(prev => ({
      ...prev,
      title: template.title || prev.title,
      location: template.location || prev.location,
      description: template.description || prev.description,
    }));
    
    if (template.collaborators && template.collaborators.length > 0) {
      setCollaborators(template.collaborators.map(c => ({
         ...c,
         id: crypto.randomUUID()
      })));
    }
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
    // Divide the remaining percentage equally among the equal split collaborators PLUS the principal user
    const equalPercentage = equalSplitCount > 0 ? remainingPercentageForEqual / (equalSplitCount + 1) : 0;

    return project.collaborators.map(c => {
      const percentage = c.splitType === 'percentage' ? (c.percentage || 0) : equalPercentage;
      const amount = (totalRevenue * percentage) / 100;
      return { ...c, calculatedPercentage: percentage, amount };
    });
  };

  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">Projects</h2>
        <div className="flex space-x-2 w-full sm:w-auto">
          {projectTemplates.length > 0 && (
            <Button variant="outline" onClick={() => setIsTemplatesDialogOpen(true)}>
              Manage Templates
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingProject && projectTemplates.length > 0 && (
                <div className="space-y-2 mb-4 p-4 bg-slate-50 border rounded-md">
                  <Label>Start from a Template (Optional)</Label>
                  <Select onValueChange={handleApplyTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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

              <div className="flex justify-between items-center pt-4">
                <Button type="button" variant="outline" onClick={handleSaveTemplate}>
                  Save as Template
                </Button>
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    {editingProject ? 'Update Project' : 'Save Project'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
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

      <Tabs defaultValue="list" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <LayoutList className="w-4 h-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeline View
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="mt-0">
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Collaborators</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      const projectInvoices = invoices.filter(i => i.projectId === project.id);
                      const totalBilled = projectInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
                      const totalPaid = projectInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
                      const progressPercentage = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 0;
                      
                      return (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.title}</TableCell>
                          <TableCell>{client?.name || 'Unknown Client'}</TableCell>
                          <TableCell>{project.location}</TableCell>
                          <TableCell>{project.date ? format(new Date(project.date), 'MMM d, yyyy') : '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${progressPercentage}%` }} />
                              </div>
                              <span className="text-xs text-muted-foreground">{progressPercentage}%</span>
                            </div>
                          </TableCell>
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
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-8 pb-8 pt-4">
            {projects.length === 0 ? (
              <p className="text-muted-foreground ml-6">No projects found. Create one to get started.</p>
            ) : (
              [...projects].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((project) => {
                const client = clients.find(c => c.id === project.clientId);
                const projectDate = project.date ? new Date(project.date) : new Date();
                const today = new Date(new Date().setHours(0,0,0,0));
                const isPast = projectDate < today;
                const isToday = isSameDay(projectDate, today);
                const badgeColor = isPast ? 'bg-slate-300 border-slate-300' : isToday ? 'bg-primary border-primary' : 'bg-blue-500 border-blue-500';
                
                const projectInvoices = invoices.filter(i => i.projectId === project.id);
                const totalBilled = projectInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
                const totalPaid = projectInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
                const progressPercentage = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 0;
                
                return (
                  <div key={project.id} className="relative pl-8 md:pl-10">
                    <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white shadow-sm ${badgeColor}`} />
                    <Card className={`border-l-4 ${isPast ? 'border-l-slate-300' : isToday ? 'border-l-primary' : 'border-l-blue-500'} hover:shadow-md transition-shadow`}>
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="w-full sm:w-auto flex-1">
                            <div className="flex items-center justify-between sm:justify-start gap-4 mb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold">{project.title}</h3>
                                {isToday && <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary">Today</span>}
                              </div>
                              <div className="flex items-center gap-2 sm:ml-4 bg-slate-50 px-2 py-1 rounded">
                                <div className="w-20 md:w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${progressPercentage}%` }} />
                                </div>
                                <span className="text-xs font-medium text-slate-600">{progressPercentage}%</span>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-2">
                               <span className="flex items-center"><strong>Client:</strong> <span className="ml-1">{client?.name || 'Unknown Client'}</span></span>
                               <span className="flex items-center"><strong>Location:</strong> <span className="ml-1">{project.location}</span></span>
                               <span className="flex items-center"><strong>Date:</strong> <span className="ml-1">{project.date ? format(projectDate, 'MMM d, yyyy') : '-'}</span></span>
                            </div>
                            {project.description && (
                              <p className="mt-3 text-sm text-slate-600 line-clamp-2">{project.description}</p>
                            )}
                          </div>
                          <div className="flex -mx-2 sm:mx-0 sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                             <div className="flex items-center justify-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border text-sm font-medium shrink-0">
                               <Users className="w-4 h-4 text-slate-500" />
                               {project.collaborators?.length || 0}
                             </div>
                             <div className="flex items-center space-x-1 sm:justify-end ml-auto sm:ml-0">
                               <Button variant="ghost" size="icon" onClick={() => handleOpenSplitDialog(project)}>
                                 <PieChart className="w-4 h-4 text-slate-500" />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(project)}>
                                 <Edit className="w-4 h-4 text-slate-500" />
                               </Button>
                               <Button variant="ghost" size="icon" onClick={() => setProjectToDelete(project.id)}>
                                 <Trash2 className="w-4 h-4 text-destructive" />
                               </Button>
                             </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

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
      <Dialog open={isTemplatesDialogOpen} onOpenChange={setIsTemplatesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {projectTemplates.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No templates saved yet.</p>
            ) : (
              <div className="space-y-2">
                {projectTemplates.map(template => (
                  <div key={template.id} className="flex justify-between items-center p-3 bg-slate-50 border rounded-md">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.collaborators?.length || 0} collaborators</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={async () => {
                      if (confirm('Are you sure you want to delete this template?')) {
                        try {
                          await deleteProjectTemplate(template.id);
                          toast.success('Template deleted');
                        } catch (e) {
                          toast.error('Failed to delete template');
                        }
                      }
                    }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
