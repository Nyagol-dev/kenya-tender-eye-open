import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Clock, XCircle, AlertTriangle, Upload, File, Loader2, Trash2 } from 'lucide-react';

const KENYA_COUNTIES = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita/Taveta", "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Machakos", "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot", "Samburu", "Trans Nzoia", "Uasin Gishu", "Elgeyo/Marakwet", "Nandi", "Baringo", "Laikipia", "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia", "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
];

interface OnboardingData {
  status: string;
  deadline?: string;
  rejection_reason?: string;
  business_name?: string;
  business_type?: string;
  registration_number?: string;
  kra_pin?: string;
  years_in_operation?: number;
  number_of_employees?: number;
  primary_category_id?: string;
  secondary_category_ids?: string[];
  counties_of_operation?: string[];
  max_contract_value?: number;
  projects?: Project[];
  documents?: DocumentData[];
}

interface Project {
  title: string;
  client_name: string;
  contract_value: number;
  year: number;
  duration_months: number;
  description: string;
}

interface DocumentData {
  id?: string;
  document_type: string;
  file_name: string;
  file_url: string;
  uploaded_at?: string;
}

export default function SupplierOnboardingPage() {
  const { user, profile, loadingInitial, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number, expired: boolean, totalSeconds: number} | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<OnboardingData>('/onboarding/me');
      setData(res);
      
      if (res.status === 'approved') {
        toast({ title: "Account Approved", description: "Your account is approved. You can now bid on tenders." });
        navigate('/');
      } else if (res.status === 'pending') {
        // Determine step based on data
        if (!res.business_name) setCurrentStep(1);
        else if (!res.primary_category_id) setCurrentStep(2);
        else if (!res.projects || res.projects.length === 0) setCurrentStep(3);
        else setCurrentStep(4);
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('Not found')) {
        // If not found, maybe they just signed up and onboarding wasn't generated
        // We'll init an empty one or it should be initialized by backend
        setData({ status: 'pending' });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (!loadingInitial && (!user || profile?.user_type !== 'supplier')) {
      navigate('/');
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, profile, loadingInitial, navigate, fetchData]);

  useEffect(() => {
    if (!data?.deadline) return;
    
    const calculateTimeLeft = () => {
      const difference = new Date(data.deadline!).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ h: 0, m: 0, s: 0, expired: true, totalSeconds: 0 });
      } else {
        setTimeLeft({
          h: Math.floor((difference / (1000 * 60 * 60)) % 48),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60),
          expired: false,
          totalSeconds: difference / 1000
        });
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [data?.deadline]);

  if (loadingInitial || loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (data?.status === 'submitted') return <StatusPage type="submitted" onLogout={signOut} />;
  if (data?.status === 'rejected') return <StatusPage type="rejected" reason={data.rejection_reason} onLogout={signOut} />;
  if (data?.status === 'expired') return <StatusPage type="expired" onLogout={signOut} />;
  if (data?.status === 'approved') return null; // will redirect

  const formatTimeLeft = () => {
    if (!timeLeft) return "";
    if (timeLeft.expired) return "EXPIRED";
    return `${timeLeft.h.toString().padStart(2, '0')}:${timeLeft.m.toString().padStart(2, '0')}:${timeLeft.s.toString().padStart(2, '0')} remaining`;
  };

  const timerColor = timeLeft 
    ? timeLeft.expired ? "text-red-500 font-bold"
      : timeLeft.totalSeconds > 24 * 3600 ? "text-green-600"
      : timeLeft.totalSeconds > 6 * 3600 ? "text-yellow-600"
      : "text-red-600 font-bold"
    : "text-muted-foreground";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary font-bold text-primary-foreground">
            K
          </div>
          <h1 className="text-xl font-semibold">Supplier Verification</h1>
        </div>
        <div className="flex items-center gap-6">
          <div className={`flex items-center gap-2 ${timerColor}`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono text-sm">{formatTimeLeft()}</span>
          </div>
          <Button variant="ghost" onClick={signOut}>Logout</Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between px-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                  step < currentStep ? 'border-primary bg-primary text-primary-foreground' :
                  step === currentStep ? 'border-primary text-primary' :
                  'border-muted text-muted-foreground'
                }`}>
                  {step < currentStep ? <Check className="h-6 w-6" /> : step}
                </div>
                <span className={`mt-2 text-xs font-medium ${step === currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                  {step === 1 && "Business Info"}
                  {step === 2 && "Services"}
                  {step === 3 && "Previous Work"}
                  {step === 4 && "Documents"}
                </span>
              </div>
            ))}
          </div>
          <div className="relative mt-[-2.5rem] -z-10 px-8">
            <div className="h-1 w-full bg-muted">
              <div 
                className="h-1 bg-primary transition-all duration-500 ease-in-out"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-16">
          {currentStep === 1 && <Step1 data={data} onNext={() => { fetchData(); setCurrentStep(2); }} />}
          {currentStep === 2 && <Step2 data={data} onBack={() => setCurrentStep(1)} onNext={() => { fetchData(); setCurrentStep(3); }} />}
          {currentStep === 3 && <Step3 data={data} onBack={() => setCurrentStep(2)} onNext={() => { fetchData(); setCurrentStep(4); }} />}
          {currentStep === 4 && <Step4 data={data} user={user} onBack={() => setCurrentStep(3)} onNext={fetchData} />}
        </div>
      </main>
    </div>
  );
}

// -----------------------------------------------------------------------------
// STEP 1: BUSINESS INFORMATION
// -----------------------------------------------------------------------------
function Step1({ data, onNext }: { data: OnboardingData | null, onNext: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: data?.business_name || '',
    business_type: data?.business_type || '',
    registration_number: data?.registration_number || '',
    kra_pin: data?.kra_pin || '',
    years_in_operation: data?.years_in_operation?.toString() || '',
    number_of_employees: data?.number_of_employees?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kra_pin.match(/^[A-Z]\d{9}[A-Z]$/)) {
      return toast({ title: "Invalid KRA PIN", description: "Must be a letter, 9 digits, and a letter (e.g. A123456789Z)", variant: "destructive" });
    }
    try {
      setLoading(true);
      await api.patch('/onboarding/step/1', {
        ...formData,
        years_in_operation: parseInt(formData.years_in_operation),
        number_of_employees: parseInt(formData.number_of_employees),
      });
      onNext();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>Provide details about your registered business entity.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="business_name">Business/Company Name *</Label>
            <Input id="business_name" required value={formData.business_name} onChange={e => setFormData({...formData, business_name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="business_type">Business Type *</Label>
              <Select value={formData.business_type} onValueChange={(val) => setFormData({...formData, business_type: val})} required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sole Proprietor">Sole Proprietor</SelectItem>
                  <SelectItem value="Partnership">Partnership</SelectItem>
                  <SelectItem value="Limited Company">Limited Company</SelectItem>
                  <SelectItem value="Cooperative">Cooperative</SelectItem>
                  <SelectItem value="NGO">NGO</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="registration_number">Registration Number *</Label>
              <Input id="registration_number" required value={formData.registration_number} onChange={e => setFormData({...formData, registration_number: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kra_pin">KRA PIN *</Label>
              <Input id="kra_pin" placeholder="A123456789Z" required value={formData.kra_pin} onChange={e => setFormData({...formData, kra_pin: e.target.value.toUpperCase()})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="years">Years in Operation *</Label>
              <Input id="years" type="number" min="0" required value={formData.years_in_operation} onChange={e => setFormData({...formData, years_in_operation: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="employees">Number of Employees *</Label>
              <Input id="employees" type="number" min="1" required value={formData.number_of_employees} onChange={e => setFormData({...formData, number_of_employees: e.target.value})} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save & Continue
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// STEP 2: SERVICE DETAILS
// -----------------------------------------------------------------------------
function Step2({ data, onNext, onBack }: { data: OnboardingData | null, onNext: () => void, onBack: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  
  const [primaryCat, setPrimaryCat] = useState(data?.primary_category_id || '');
  const [secondaryCats, setSecondaryCats] = useState<string[]>(data?.secondary_category_ids || []);
  const [counties, setCounties] = useState<string[]>(data?.counties_of_operation || []);
  const [maxValue, setMaxValue] = useState(data?.max_contract_value?.toString() || '');

  useEffect(() => {
    api.get<{id: string, name: string}[]>('/service-categories').then(setCategories).catch(console.error);
  }, []);

  const toggleCounty = (c: string) => {
    setCounties(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };
  
  const toggleSecondaryCat = (id: string) => {
    setSecondaryCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.patch('/onboarding/step/2', {
        primary_category_id: primaryCat,
        secondary_category_ids: secondaryCats,
        counties_of_operation: counties,
        max_contract_value: parseFloat(maxValue) || 0,
      });
      onNext();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Details</CardTitle>
        <CardDescription>Tell us about the services you offer and your operational capacity.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label>Primary Service Category *</Label>
            <Select value={primaryCat} onValueChange={setPrimaryCat} required>
              <SelectTrigger><SelectValue placeholder="Select primary category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label>Secondary Categories (Optional)</Label>
            <div className="grid grid-cols-2 gap-2 border p-4 rounded-md bg-background">
              {categories.filter(c => c.id !== primaryCat).map(c => (
                <div key={c.id} className="flex items-center space-x-2">
                  <Checkbox id={`sec-${c.id}`} checked={secondaryCats.includes(c.id)} onCheckedChange={() => toggleSecondaryCat(c.id)} />
                  <label htmlFor={`sec-${c.id}`} className="text-sm">{c.name}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Counties of Operation (Optional, default is nationwide)</Label>
            <ScrollArea className="h-48 border rounded-md p-4 bg-background">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {KENYA_COUNTIES.map(c => (
                  <div key={c} className="flex items-center space-x-2">
                    <Checkbox id={`county-${c}`} checked={counties.includes(c)} onCheckedChange={() => toggleCounty(c)} />
                    <label htmlFor={`county-${c}`} className="text-sm">{c}</label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="max_val">Maximum Contract Value handled (KES) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">KES</span>
              <Input id="max_val" type="number" min="0" className="pl-12" required value={maxValue} onChange={e => setMaxValue(e.target.value)} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button type="button" variant="outline" onClick={onBack}>Back</Button>
          <Button type="submit" disabled={loading || !primaryCat || !maxValue}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save & Continue
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// STEP 3: PREVIOUS WORK
// -----------------------------------------------------------------------------
function Step3({ data, onNext, onBack }: { data: OnboardingData | null, onNext: () => void, onBack: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>(data?.projects || []);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: '', client_name: '', contract_value: '', year: new Date().getFullYear().toString(), duration_months: '', description: ''
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.description.length < 50) return toast({ title: "Validation Error", description: "Description must be at least 50 characters.", variant: "destructive" });
    
    const newProj: Project = {
      title: form.title, client_name: form.client_name, 
      contract_value: parseFloat(form.contract_value), year: parseInt(form.year), 
      duration_months: parseInt(form.duration_months), description: form.description
    };
    
    setProjects([...projects, newProj]);
    setOpen(false);
    setForm({ title: '', client_name: '', contract_value: '', year: new Date().getFullYear().toString(), duration_months: '', description: '' });
  };

  const removeProject = (idx: number) => {
    setProjects(projects.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (projects.length === 0) return toast({ title: "Required", description: "Please add at least one project.", variant: "destructive" });
    try {
      setLoading(true);
      await api.patch('/onboarding/step/3', { projects });
      onNext();
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to save data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Previous Work</CardTitle>
        <CardDescription>Add at least one previous project or contract to demonstrate your experience.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center bg-muted/20">
            <p className="text-muted-foreground mb-4">No projects added yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((p, i) => (
              <div key={i} className="flex justify-between items-start rounded-lg border p-4 bg-background">
                <div>
                  <h4 className="font-medium text-primary">{p.title}</h4>
                  <p className="text-sm text-muted-foreground">Client: {p.client_name} • KES {p.contract_value.toLocaleString()} • Year: {p.year}</p>
                  <p className="text-sm mt-2 line-clamp-2">{p.description}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeProject(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">Add Project</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleAdd}>
              <DialogHeader>
                <DialogTitle>Add Project Details</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="p_title">Project Title *</Label>
                  <Input id="p_title" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p_client">Client Name *</Label>
                  <Input id="p_client" required value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="p_val">Contract Value (KES) *</Label>
                    <Input id="p_val" type="number" required min="0" value={form.contract_value} onChange={e => setForm({...form, contract_value: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="p_year">Year *</Label>
                    <Select value={form.year} onValueChange={v => setForm({...form, year: v})} required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 25}, (_, i) => new Date().getFullYear() - i).map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p_dur">Duration (Months) *</Label>
                  <Input id="p_dur" type="number" required min="1" value={form.duration_months} onChange={e => setForm({...form, duration_months: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p_desc">Brief Description (Min 50 chars) *</Label>
                  <Textarea id="p_desc" required minLength={50} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Project</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleSave} disabled={loading || projects.length === 0}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save & Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// STEP 4: DOCUMENTS
// -----------------------------------------------------------------------------
const REQ_DOCS = [
  { id: 'Certificate of Incorporation', label: 'Certificate of Incorporation / Business Registration' },
  { id: 'Tax Compliance', label: 'KRA Tax Compliance Certificate' },
  { id: 'National ID', label: 'Director/Proprietor National ID' }
];

const OPT_DOCS = [
  { id: 'CR12', label: 'CR12 Form (Limited Companies)' },
  { id: 'Financial Accounts', label: 'Audited Financial Accounts (Last 2 Years)' },
  { id: 'Bank Statement', label: 'Bank Statement (Last 6 months)' },
  { id: 'Business Permit', label: 'Business Permit' },
  { id: 'Evidence of Contracts', label: 'Evidence of Previous Contracts' },
  { id: 'NCA Certificate', label: 'NCA Certificate (Construction)' }
];

function Step4({ data, user, onNext, onBack }: { data: OnboardingData | null, user: any, onNext: () => void, onBack: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocumentData[]>(data?.documents || []);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docType);
    try {
      // Fake upload URL
      const fileUrl = `/uploads/${user.id}/${encodeURIComponent(file.name)}`;
      
      const res = await api.post<DocumentData>('/onboarding/documents', {
        document_type: docType,
        file_name: file.name,
        file_url: fileUrl
      });

      setDocs(prev => {
        const filtered = prev.filter(d => d.document_type !== docType);
        return [...filtered, res];
      });
      toast({ title: "Uploaded", description: `${docType} uploaded successfully.` });
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingDoc(null);
    }
  };

  const submitFinal = async () => {
    try {
      setLoading(true);
      await api.patch('/onboarding/step/4');
      onNext(); // will fetch data and transition to Under Review
    } catch (err: any) {
      toast({ title: "Submission Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isAllRequiredUploaded = REQ_DOCS.every(rd => docs.some(d => d.document_type === rd.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Required Documents</CardTitle>
        <CardDescription>Upload necessary files to verify your entity. Formats: PDF, JPG, PNG, DOCX.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-md bg-muted/30 border">
          <h4 className="font-semibold mb-2">Submission Checklist</h4>
          <div className="grid gap-2">
            {REQ_DOCS.map(rd => {
              const uploaded = docs.some(d => d.document_type === rd.id);
              return (
                <div key={rd.id} className="flex items-center space-x-2 text-sm">
                  {uploaded ? <Check className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                  <span>{rd.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">Required Documents</h3>
          {REQ_DOCS.map(d => <DocSlot key={d.id} doc={d} required docs={docs} uploading={uploadingDoc === d.id} onUpload={e => handleFileUpload(e, d.id)} />)}
          
          <h3 className="font-semibold mt-6">Additional Documents (Optional)</h3>
          {OPT_DOCS.map(d => <DocSlot key={d.id} doc={d} required={false} docs={docs} uploading={uploadingDoc === d.id} onUpload={e => handleFileUpload(e, d.id)} />)}
        </div>

      </CardContent>
      <CardFooter className="justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={submitFinal} disabled={loading || !isAllRequiredUploaded}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit for Review
        </Button>
      </CardFooter>
    </Card>
  );
}

function DocSlot({ doc, required, docs, uploading, onUpload }: { doc: any, required: boolean, docs: DocumentData[], uploading: boolean, onUpload: (e: any) => void }) {
  const uploaded = docs.find(d => d.document_type === doc.id);

  return (
    <div className="flex items-center justify-between border rounded-lg p-4 bg-background">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">{doc.label}</h4>
          {required ? <Badge variant="destructive">Required</Badge> : <Badge variant="secondary">Optional</Badge>}
        </div>
        {uploaded ? (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <File className="h-3 w-3" /> {uploaded.file_name} <Check className="h-3 w-3 text-green-500 ml-2" />
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">Not uploaded</p>
        )}
      </div>
      <div>
        <Input type="file" id={`file-${doc.id}`} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={onUpload} disabled={uploading} />
        <Label htmlFor={`file-${doc.id}`} className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : uploaded ? "Replace" : <><Upload className="h-4 w-4 mr-2" /> Upload</>}
        </Label>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// STATUS PAGES
// -----------------------------------------------------------------------------
function StatusPage({ type, reason, onLogout }: { type: 'submitted' | 'rejected' | 'expired', reason?: string, onLogout: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-6 border-0 shadow-lg bg-background">
        <CardContent className="pt-6 flex flex-col items-center">
          {type === 'submitted' && <Clock className="h-16 w-16 text-green-500 mb-4" />}
          {type === 'rejected' && <XCircle className="h-16 w-16 text-red-500 mb-4" />}
          {type === 'expired' && <AlertTriangle className="h-16 w-16 text-orange-500 mb-4" />}
          
          <h2 className="text-2xl font-bold mb-2">
            {type === 'submitted' && "Application Under Review"}
            {type === 'rejected' && "Application Rejected"}
            {type === 'expired' && "Onboarding Period Expired"}
          </h2>
          
          <p className="text-muted-foreground mb-6">
            {type === 'submitted' && "Your application has been submitted and is being reviewed by our team. You will be notified once a decision is made. This typically takes 2-3 business days."}
            {type === 'rejected' && (
              <>
                <span className="block mb-2 text-foreground font-medium">Reason: {reason || "Not provided"}</span>
                If you believe this is an error, contact support at support@eprocurement.go.ke
              </>
            )}
            {type === 'expired' && "Your 48-hour verification window has expired and your account has been removed. Please register again to start the process."}
          </p>

          <div className="flex gap-4 w-full">
            {type === 'expired' && <Button className="w-full" onClick={() => navigate('/auth')}>Register Again</Button>}
            <Button variant="outline" className="w-full" onClick={onLogout}>Logout</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
