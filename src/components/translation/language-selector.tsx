'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SUPPORTED_LANGUAGES } from '@/lib/ai';

interface LanguageSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function LanguageSelector({
  value,
  onValueChange,
  placeholder = 'Select language',
  disabled = false,
}: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(value);

  useEffect(() => {
    setSelectedLanguage(value);
  }, [value]);

  const handleSelect = (currentValue: string) => {
    setSelectedLanguage(currentValue);
    onValueChange(currentValue);
    setOpen(false);
  };

  const languageName = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage)?.name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedLanguage && languageName
            ? languageName
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandEmpty>No language found.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((language) => (
              <CommandItem
                key={language.code}
                value={language.code}
                onSelect={handleSelect}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedLanguage === language.code ? "opacity-100" : "opacity-0"
                  )}
                />
                {language.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 