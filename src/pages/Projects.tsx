import { PDFLoader } from "@/components/PDFLoader";
import React, { useState, useRef, useEffect } from "react";
import { useLocation } from 'react-router-dom';
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
import { Plus, Edit, Trash2, Users, PieChart, LayoutList, Clock, CheckSquare, FileText, Download, Loader2 } from 'lucide-react';
import { format, isAfter, isBefore, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';

export function Projects() {

  const { projects, projectTemplates, clients, invoices, quotes, addProject, updateProject, deleteProject, updateQuote, addProjectTemplate, deleteProjectTemplate } = useStore();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const highlightedId = searchParams.get('highlight');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingSplitProject, setViewingSplitProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const projectRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    location: '',
    date: '',
    description: '',
  });
  const [collaborators, setCollaborators] = useState<CollaboratorSplit[]>([]);

  const handleOpenPreview = (project: Project) => {
    setPreviewProject(project);
    setIsPreviewOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!projectRef.current || isGeneratingPDF || !previewProject) return;
    
    setIsGeneratingPDF(true);
    const originalScrollPos = window.scrollY;
    window.scrollTo(0, 0);

    try {
      const element = projectRef.current;
      const originalStyle = element.style.cssText;
      const originalClass = element.className;
      
      element.className = element.className.replace('mx-auto', '').replace('max-w-[760px]', '').replace('w-full', '') + ' pdf-export';
      element.style.width = '760px'; 
      element.style.minWidth = '760px';
      element.style.maxWidth = '760px';
      element.style.margin = '0px';
      element.style.padding = '0px';
      element.style.boxShadow = 'none';
      
      // Allow layout to recalculate
      await new Promise(resolve => setTimeout(resolve, 100));

      const safeTitle = (previewProject.title || 'Project').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      const htmlToImage = await import('html-to-image');
      const jsPDFModule = await import('jspdf');
      const jsPDF = ('default' in jsPDFModule ? jsPDFModule.default : jsPDFModule) as any;

      const dataUrl = await htmlToImage.toPng(element, { 
        quality: 1, 
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
        width: 760,
        style: {
          margin: '0',
          padding: '0',
          maxWidth: '760px',
          width: '760px',
          boxShadow: 'none',
        }
      });
      
      const pdfWidth = 210; // A4 width in mm
      const pdfHeightOriginal = (element.offsetHeight * pdfWidth) / 760;
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeightOriginal]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeightOriginal);
      pdf.save(`${safeTitle}_report.pdf`);
      
      // Restore element
      element.style.cssText = originalStyle;
      element.className = originalClass;
      window.scrollTo(0, originalScrollPos);
      
      toast.success("PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

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

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('new') === 'true') {
      handleOpenDialog();
    }
  }, []);

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

    const fixedAndTransportCollaborators = project.collaborators.filter(c => c.splitType === 'fixed' || c.splitType === 'transport');
    const totalFixedAmount = fixedAndTransportCollaborators.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    
    const remainingRevenue = Math.max(0, totalRevenue - totalFixedAmount);

    const equalSplitCount = project.collaborators.filter(c => c.splitType === 'equal').length;
    const percentageCollaborators = project.collaborators.filter(c => c.splitType === 'percentage');
    
    let totalPercentageAllocated = percentageCollaborators.reduce((sum, c) => sum + Number(c.percentage || 0), 0);
    
    // Ensure we don't exceed 100%
    if (totalPercentageAllocated > 100) totalPercentageAllocated = 100;
    
    const remainingPercentageForEqual = 100 - totalPercentageAllocated;
    // Divide the remaining percentage equally among the equal split collaborators PLUS the principal user
    const equalPercentage = equalSplitCount > 0 ? remainingPercentageForEqual / (equalSplitCount + 1) : 0;

    return project.collaborators
      .filter(c => c.splitType !== 'transport')
      .map(c => {
      if (c.splitType === 'fixed' || c.splitType === 'transport') {
        const amount = Number(c.amount || 0);
        const calculatedPercentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
        return { ...c, calculatedPercentage, amount };
      }

      const percentage = c.splitType === 'percentage' ? Number(c.percentage || 0) : equalPercentage;
      const amount = (remainingRevenue * percentage) / 100;
      return { ...c, calculatedPercentage: percentage, amount };
    });
  };

  const [isTemplatesDialogOpen, setIsTemplatesDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PDFLoader isGenerating={isGeneratingPDF} />
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
                  <div className="space-y-3 pt-2">
                    {collaborators.map((collab) => (
                      <div key={collab.id} className="flex flex-col gap-3 bg-slate-50 p-3 rounded-md border">
                        {collab.splitType !== 'transport' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <Input
                                placeholder="Collaborator Name"
                                value={collab.name}
                                onChange={(e) => updateCollaborator(collab.id, 'name', e.target.value)}
                                required
                              />
                            </div>
                            <div className="flex-1">
                              <Select
                                value={collab.role || ''}
                                onValueChange={(value: any) => updateCollaborator(collab.id, 'role', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Lead Photographer">Lead Photographer</SelectItem>
                                  <SelectItem value="Assistant Photographer">Assistant Photographer</SelectItem>
                                  <SelectItem value="Videographer">Videographer</SelectItem>
                                  <SelectItem value="Assistant Videographer">Assistant Videographer</SelectItem>
                                  <SelectItem value="Drone Pilot">Drone Pilot</SelectItem>
                                  <SelectItem value="Editor">Editor</SelectItem>
                                  <SelectItem value="Colorist">Colorist</SelectItem>
                                  <SelectItem value="Makeup Artist">Makeup Artist</SelectItem>
                                  <SelectItem value="Stylist">Stylist</SelectItem>
                                  <SelectItem value="Lighting Assistant">Lighting Assistant</SelectItem>
                                  <SelectItem value="Production Assistant">Production Assistant</SelectItem>
                                  <SelectItem value="Audio Technician">Audio Technician</SelectItem>
                                  <SelectItem value="Director">Director</SelectItem>
                                  <SelectItem value="Producer">Producer</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-500 hover:text-destructive" onClick={() => removeCollaborator(collab.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-32 shrink-0">
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
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                <SelectItem value="transport">Transport Expense</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {(collab.splitType === 'percentage' || collab.splitType === 'fixed' || collab.splitType === 'transport') && (
                            <div className="w-24 shrink-0">
                              <Input
                                type="number"
                                placeholder={collab.splitType === 'percentage' ? '%' : 'Amount'}
                                min="0"
                                max={collab.splitType === 'percentage' ? "100" : undefined}
                                step={collab.splitType === 'percentage' ? "0.01" : "1"}
                                value={collab.splitType === 'percentage' ? (collab.percentage || '') : (collab.amount || '')}
                                onChange={(e) => {
                                  if (collab.splitType === 'percentage') {
                                    updateCollaborator(collab.id, 'percentage', Number(e.target.value));
                                  } else {
                                    updateCollaborator(collab.id, 'amount', Number(e.target.value));
                                  }
                                }}
                                required
                              />
                            </div>
                          )}
                          {collab.splitType === 'transport' && (
                            <div className="flex-1 min-w-[150px]">
                              <Input
                                placeholder="e.g. Malindi to Watamu"
                                value={collab.description || ''}
                                onChange={(e) => updateCollaborator(collab.id, 'description', e.target.value)}
                              />
                            </div>
                          )}
                          {collab.splitType === 'transport' && (
                            <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-500 hover:text-destructive ml-auto" onClick={() => removeCollaborator(collab.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
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
                      <TableHead>Role</TableHead>
                      <TableHead>Share</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculateSplit(viewingSplitProject).map((split, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{split.name}</TableCell>
                        <TableCell className="text-slate-500">{split.role || '-'}</TableCell>
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
                        <TableRow 
                          key={project.id}
                          className={highlightedId === project.id ? "bg-slate-100 ring-2 ring-slate-400 ring-inset transition-all duration-500" : ""}
                        >
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
                            <Button variant="ghost" size="icon" onClick={() => handleOpenPreview(project)} title="View Report">
                              <FileText className="w-4 h-4" />
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

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-slate-50">
          <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex justify-between items-center">
            <DialogTitle className="text-xl font-bold">Project Report Preview</DialogTitle>
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
                {isGeneratingPDF ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Download PDF</>
                )}
              </Button>
            </div>
          </div>
          
          {previewProject && (() => {
            const client = clients.find(c => c.id === previewProject.clientId);
            const projectInvoices = invoices.filter(i => i.projectId === previewProject.id);
            const totalBilled = projectInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
            const totalPaid = projectInvoices.reduce((sum, i) => sum + i.amountPaid, 0);
            const progressPercentage = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 0;
            const splits = calculateSplit(previewProject);

            return (
              <div className="m-4 sm:m-6">
                <style dangerouslySetInnerHTML={{ __html: `
                  .pdf-export {
                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
                    background-color: white !important;
                    color: #1e293b;
                  }
                  .pdf-export * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .pdf-export .border-b { border-bottom: 1px solid #e2e8f0 !important; }
                  .pdf-export .bg-slate-50 { background-color: #f8fafc !important; }
                `}} />
                
                <div ref={projectRef} className="bg-white border rounded-lg shadow-sm mx-auto max-w-[760px] w-full p-8 md:p-12 invoice-root relative overflow-hidden">
                  {/* Header */}
                  <div className="border-b pb-8 mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">{previewProject.title}</h1>
                    <div className="text-slate-500 text-lg">Project Report</div>
                  </div>

                  {/* Project Meta */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Details</h3>
                      <div className="space-y-1 text-slate-800">
                        <p><strong>Date:</strong> {previewProject.date ? format(new Date(previewProject.date), 'MMMM d, yyyy') : 'TBD'}</p>
                        <p><strong>Location:</strong> {previewProject.location || 'TBD'}</p>
                        <p><strong>Status:</strong> {progressPercentage === 100 ? 'Completed' : 'In Progress'}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Client Details</h3>
                      <div className="space-y-1 text-slate-800">
                        <p><strong>Name:</strong> {client?.name || 'Unknown Client'}</p>
                        {client?.email && <p><strong>Email:</strong> {client.email}</p>}
                        {client?.phone && <p><strong>Phone:</strong> {client.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {previewProject.description && (
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
                      <p className="text-slate-700 whitespace-pre-wrap">{previewProject.description}</p>
                    </div>
                  )}

                  {/* Financials & Roles */}
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Financial Summary</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 font-medium">Total Billed</p>
                        <p className="text-2xl font-bold text-slate-800">KES {totalBilled.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <p className="text-sm text-slate-500 font-medium">Total Paid (Revenue)</p>
                        <p className="text-2xl font-bold text-green-600">KES {totalPaid.toLocaleString()}</p>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Team Roles & Cost Split</h3>
                    {splits.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold text-slate-900">Collaborator</TableHead>
                            <TableHead className="font-semibold text-slate-900">Role</TableHead>
                            <TableHead className="font-semibold text-slate-900">Share</TableHead>
                            <TableHead className="text-right font-semibold text-slate-900">Calculated Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {splits.map((split, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-slate-800 font-medium">{split.name}</TableCell>
                              <TableCell className="text-slate-600">{split.role || '-'}</TableCell>
                              <TableCell className="text-slate-600">{split.calculatedPercentage.toFixed(1)}%</TableCell>
                              <TableCell className="text-right font-semibold text-slate-800">
                                KES {split.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-slate-500 text-sm">No team members assigned or no revenue to split.</p>
                    )}
                  </div>
                  
                  {/* Footer */}
                  <div className="border-t pt-6 mt-12 text-center text-slate-400 text-sm">
                    Report generated on {format(new Date(), 'MMMM d, yyyy')}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

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
