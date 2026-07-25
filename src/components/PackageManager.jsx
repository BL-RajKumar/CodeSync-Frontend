import React, { useState, useMemo } from 'react';
import { Package, Plus, Trash2, Box } from 'lucide-react';
import { toast } from 'react-toastify';

const PackageManager = ({ files, onSaveFile, isReadOnly }) => {
  const [newPackage, setNewPackage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find package.json
  const packageJsonFile = useMemo(() => {
    return files?.find(f => f.path === 'package.json' || f.name === 'package.json');
  }, [files]);

  // Parse dependencies
  const dependencies = useMemo(() => {
    if (!packageJsonFile || !packageJsonFile.content) return {};
    try {
      const parsed = JSON.parse(packageJsonFile.content);
      return parsed.dependencies || {};
    } catch (e) {
      console.error("Failed to parse package.json", e);
      return {};
    }
  }, [packageJsonFile]);

  const handleAddDependency = async (e) => {
    e.preventDefault();
    if (!newPackage.trim() || isReadOnly || isSubmitting) return;

    if (!packageJsonFile) {
      toast.error("No package.json found in the project root.");
      return;
    }

    setIsSubmitting(true);
    try {
      let parsed = { dependencies: {} };
      try {
        parsed = JSON.parse(packageJsonFile.content || '{}');
      } catch (err) {
        // use empty object if invalid JSON
      }

      if (!parsed.dependencies) {
        parsed.dependencies = {};
      }

      // Handle version specific (e.g. framer-motion@10.0.0)
      let pkgName = newPackage.trim();
      let pkgVersion = 'latest';
      
      // If there's an @ symbol not at the very beginning (like @types/react)
      const atIndex = pkgName.lastIndexOf('@');
      if (atIndex > 0) {
        pkgVersion = pkgName.substring(atIndex + 1);
        pkgName = pkgName.substring(0, atIndex);
      }

      // If version is latest, attempt to fetch the actual semver version from NPM registry
      if (pkgVersion === 'latest') {
        try {
          const res = await fetch(`https://registry.npmjs.org/${pkgName}/latest`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.version) {
              pkgVersion = `^${data.version}`;
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch latest version for ${pkgName}, falling back to 'latest'`, err);
        }
      }

      parsed.dependencies[pkgName] = pkgVersion;
      
      const newContent = JSON.stringify(parsed, null, 2);
      
      // Call onSaveFile (which is handleSaveFileContent from ProjectEditor)
      await onSaveFile(packageJsonFile.fileId || packageJsonFile._id, newContent);
      setNewPackage('');
      // Toast is handled by onSaveFile, but we can do a local one if we want
    } catch (error) {
      console.error(error);
      toast.error('Failed to update package.json');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveDependency = async (pkgName) => {
    if (isReadOnly || isSubmitting) return;
    
    if (!packageJsonFile) return;

    setIsSubmitting(true);
    try {
      let parsed = JSON.parse(packageJsonFile.content || '{}');
      
      if (parsed.dependencies && parsed.dependencies[pkgName]) {
        delete parsed.dependencies[pkgName];
        const newContent = JSON.stringify(parsed, null, 2);
        await onSaveFile(packageJsonFile.fileId || packageJsonFile._id, newContent);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove dependency');
    } finally {
      setIsSubmitting(false);
    }
  };

  const depEntries = Object.entries(dependencies);

  return (
    <div className="flex flex-col border-t border-white/5 bg-[#1e1e2e]">
      <div className="px-3 py-2 border-b border-white/5 text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-between">
        <span className="flex items-center gap-1.5"><Box size={14} /> Dependencies</span>
      </div>
      
      <div className="p-2">
        {!isReadOnly && (
          <form onSubmit={handleAddDependency} className="flex mb-2">
            <input 
              type="text"
              value={newPackage}
              onChange={e => setNewPackage(e.target.value)}
              placeholder="enter package name"
              disabled={isSubmitting}
              className="flex-1 bg-dark border border-white/10 text-main px-2 py-1.5 text-xs rounded-l-md outline-none focus:border-primary/50 transition-colors placeholder:text-muted/50"
            />
            <button 
              type="submit"
              disabled={!newPackage.trim() || isSubmitting}
              className="bg-primary/20 text-primary px-2 rounded-r-md hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-l-0 border-primary/30"
              title="Add Dependency"
            >
              <Plus size={14} />
            </button>
          </form>
        )}

        <div className="max-h-[150px] overflow-y-auto">
          {depEntries.length === 0 ? (
            <div className="text-xs text-muted/50 text-center py-2 italic">No dependencies found</div>
          ) : (
            <ul className="space-y-1">
              {depEntries.map(([name, version]) => (
                <li key={name} className="flex items-center justify-between group hover:bg-white/5 px-2 py-1 rounded transition-colors text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Package size={12} className="text-muted shrink-0" />
                    <span className="text-main truncate" title={name}>{name}</span>
                    <span className="text-muted/50 text-[10px] shrink-0">v{version.replace('^', '').replace('~', '')}</span>
                  </div>
                  {!isReadOnly && (
                    <button 
                      onClick={() => handleRemoveDependency(name)}
                      disabled={isSubmitting}
                      className="text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                      title="Remove"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PackageManager;
