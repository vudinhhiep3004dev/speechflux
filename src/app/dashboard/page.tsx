'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/components/auth/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuthContext();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Transcriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">You haven't created any transcriptions yet.</p>
          <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            Upload Audio
          </button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Translations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">You haven't created any translations yet.</p>
          <button className="mt-4 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            Translate Content
          </button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Minutes Processed</p>
              <p className="text-2xl font-semibold">0 / 60</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '0%' }}></div>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="font-medium">Free Plan</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 