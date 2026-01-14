import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries, type Country } from '@/data/countries';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function OrientationProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assistId, setAssistId] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    phoneCode: '',
    phoneNumber: '',
    country: '',
    city: '',
  });
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate age options (18-65)
  const ageOptions = Array.from({ length: 48 }, (_, i) => (i + 18).toString());

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        // Get assist ID
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', user.id)
          .eq('role', 'assist')
          .single();
        
        if (roleData) {
          const formattedId = `A${String(roleData.id).padStart(5, '0')}`;
          setAssistId(formattedId);
        }

        // Get profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) {
          // Parse name
          const nameParts = (profileData.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Parse phone
          const phoneParts = (profileData.phone || '').match(/^(\+\d+)\s*(.*)$/);
          const phoneCode = phoneParts?.[1] || '';
          const phoneNumber = phoneParts?.[2] || '';

          // Cast to get extended fields (age, country, city added via migration)
          const extendedProfile = profileData as typeof profileData & {
            age?: number | null;
            country?: string | null;
            city?: string | null;
          };

          setFormData({
            firstName,
            lastName,
            age: extendedProfile.age?.toString() || '',
            phoneCode,
            phoneNumber,
            country: extendedProfile.country || '',
            city: extendedProfile.city || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Update cities when country changes
  useEffect(() => {
    if (formData.country) {
      const countryData = countries.find((c: Country) => c.name === formData.country);
      setAvailableCities(countryData?.cities || []);
      if (countryData?.phoneCode && !formData.phoneCode) {
        setFormData(prev => ({ ...prev, phoneCode: countryData.phoneCode, city: '' }));
      } else if (formData.city && !countryData?.cities?.includes(formData.city)) {
        setFormData(prev => ({ ...prev, city: '' }));
      }
    }
  }, [formData.country]);

  const isFormValid = 
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.age &&
    formData.phoneNumber.trim() &&
    formData.country &&
    formData.city;

  const handleContinue = () => {
    // Store data in sessionStorage
    sessionStorage.setItem('orientation_firstName', formData.firstName.trim());
    sessionStorage.setItem('orientation_lastName', formData.lastName.trim());
    sessionStorage.setItem('orientation_age', formData.age);
    sessionStorage.setItem('orientation_phone', `${formData.phoneCode} ${formData.phoneNumber}`.trim());
    sessionStorage.setItem('orientation_country', formData.country);
    sessionStorage.setItem('orientation_city', formData.city);
    navigate('/orientation/skills');
  };

  const phoneCodes = [...new Set(countries.map(c => c.phoneCode))].sort();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <Button
        variant="ghost"
        onClick={() => navigate('/orientation/welcome')}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          <div className="h-2 w-8 rounded-full bg-primary" />
          <div className="h-2 w-8 rounded-full bg-muted" />
          <div className="h-2 w-8 rounded-full bg-muted" />
        </div>

        <Card className="shadow-soft">
          <CardHeader className="text-center">
            <div className="text-sm font-medium text-primary mb-2">STEP 1</div>
            <CardTitle className="text-2xl">Assistant Profile</CardTitle>
            <CardDescription>
              Complete your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Assistant ID - Read Only */}
            <div className="space-y-2">
              <Label>Assistant ID</Label>
              <Input
                value={assistId}
                disabled
                className="bg-muted font-mono"
              />
              <p className="text-xs text-muted-foreground">Auto-generated, cannot be edited</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Age <span className="text-destructive">*</span></Label>
              <Select
                value={formData.age}
                onValueChange={(value) => setFormData({ ...formData, age: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select your age" />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50 max-h-[300px]">
                  {ageOptions.map((age) => (
                    <SelectItem key={age} value={age}>
                      {age}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Phone Number <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Select
                  value={formData.phoneCode}
                  onValueChange={(value) => setFormData({ ...formData, phoneCode: value })}
                >
                  <SelectTrigger className="w-[100px] bg-background">
                    <SelectValue placeholder="+1" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50 max-h-[300px]">
                    {phoneCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="234 567 8900"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Country <span className="text-destructive">*</span></Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50 max-h-[300px]">
                  {countries.map((country: Country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>City <span className="text-destructive">*</span></Label>
              <Select
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
                disabled={!formData.country}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={formData.country ? "Select city" : "Select country first"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50 max-h-[300px]">
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="lg"
              className="w-full mt-4"
              disabled={!isFormValid}
              onClick={handleContinue}
            >
              Next
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
