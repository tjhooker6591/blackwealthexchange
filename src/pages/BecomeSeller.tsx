import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from 'next/router';

const BecomeSeller: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    website: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Post to backend API (replace with actual endpoint)
    const response = await fetch('/api/sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (response.ok) {
      alert('Registration successful!');
      router.push('/seller-dashboard');
    } else {
      alert('Failed to register. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-lg w-full p-6 shadow-lg">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">Become a Seller</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="businessName" placeholder="Business Name" value={formData.businessName} onChange={handleChange} required />
            <Input name="ownerName" placeholder="Owner's Name" value={formData.ownerName} onChange={handleChange} required />
            <Input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            <Input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
            <Input name="website" placeholder="Website (optional)" value={formData.website} onChange={handleChange} />
            <textarea name="description" placeholder="Business Description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-md" rows={4}></textarea>
            <Button type="submit" className="w-full">Submit</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BecomeSeller;