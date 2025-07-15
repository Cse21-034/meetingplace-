/**
 * Database Configuration Component
 * 
 * Allows users to configure database connection settings remotely.
 * Provides flexibility for hosting on different servers.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Database, Settings, CheckCircle, AlertCircle } from "lucide-react";

interface DatabaseConfigProps {
  trigger?: React.ReactNode;
}

export default function DatabaseConfig({ trigger }: DatabaseConfigProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: '',
    ssl: true
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const testConnection = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/database/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        setConnectionStatus('success');
        toast({
          title: "Connection successful!",
          description: "Database connection has been established.",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Connection failed",
          description: "Could not connect to the database. Please check your settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Connection error",
        description: "Network error while testing connection.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      const response = await fetch('/api/database/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast({
          title: "Configuration saved",
          description: "Database configuration has been updated successfully.",
        });
        setIsOpen(false);
      } else {
        toast({
          title: "Save failed",
          description: "Could not save database configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Save error",
        description: "Network error while saving configuration.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Database size={16} />
            Database Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={20} />
            Database Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Status */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Connection Status</span>
                {connectionStatus === 'success' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle size={16} />
                    <span className="text-xs">Connected</span>
                  </div>
                )}
                {connectionStatus === 'error' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle size={16} />
                    <span className="text-xs">Failed</span>
                  </div>
                )}
                {connectionStatus === 'idle' && (
                  <span className="text-xs text-gray-500">Not tested</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuration Form */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
                placeholder="localhost or database URL"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: e.target.value })}
                  placeholder="5432"
                />
              </div>
              <div>
                <Label htmlFor="database">Database</Label>
                <Input
                  id="database"
                  value={config.database}
                  onChange={(e) => setConfig({ ...config, database: e.target.value })}
                  placeholder="kgotla_db"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                placeholder="Database username"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                placeholder="Database password"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={testConnection}
              disabled={isConnecting}
              variant="outline"
              className="flex-1"
            >
              {isConnecting ? "Testing..." : "Test Connection"}
            </Button>
            <Button
              onClick={saveConfiguration}
              disabled={connectionStatus !== 'success'}
              className="flex-1"
            >
              Save Configuration
            </Button>
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Migration Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-gray-600 space-y-1">
              <p>• For PostgreSQL: Use connection string format</p>
              <p>• For cloud hosting: Enable SSL connections</p>
              <p>• For local development: Use localhost:5432</p>
              <p>• Database will be created automatically if it doesn't exist</p>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}