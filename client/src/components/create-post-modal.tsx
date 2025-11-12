import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Pen, 
  Image, 
  BarChart3, 
  HelpCircle, 
  X, 
  Plus,
  Save,
  Send,
  Upload
} from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'tn';
}

const postTypes = [
  { id: 'text', icon: Pen, label: { en: 'Text', tn: 'Mokwalo' } },
  { id: 'image', icon: Image, label: { en: 'Photo', tn: 'Setshwantsho' } },
  { id: 'poll', icon: BarChart3, label: { en: 'Poll', tn: 'Dipotsolotso' } },
  { id: 'question', icon: HelpCircle, label: { en: 'Question', tn: 'Potso' } },
];

const predefinedTags = [
  { id: 'general', label: { en: '#General', tn: '#Kakaretso' }, color: 'bg-blue-100 text-blue-600' },
  { id: 'culture', label: { en: '#Culture', tn: '#Setso' }, color: 'bg-green-100 text-green-600' },
  { id: 'business', label: { en: '#Business', tn: '#Kgwebo' }, color: 'bg-purple-100 text-purple-600' },
  { id: 'education', label: { en: '#Education', tn: '#Thuto' }, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'health', label: { en: '#Health', tn: '#Boitekanelo' }, color: 'bg-red-100 text-red-600' },
  { id: 'technology', label: { en: '#Technology', tn: '#Thekenoloji' }, color: 'bg-indigo-100 text-indigo-600' },
];

export default function CreatePostModal({ isOpen, onClose, language }: CreatePostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [postType, setPostType] = useState('text');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const texts = {
    en: {
      title: 'Create Post',
      placeholder: "What's on your mind? Share your thoughts, wisdom, or questions with the community...",
      tags: 'Tags',
      addTag: '+ Add Tag',
      anonymous: 'Post anonymously',
      comments: 'Enable comments',
      saveDraft: 'Save Draft',
      post: 'Post',
      pollOption: 'Poll Option',
      addOption: 'Add Option',
      questionPlaceholder: 'Ask your question here...',
      titlePlaceholder: 'Enter a title for your post...',
      uploadImage: 'Upload Image',
      imagePlaceholder: 'Choose an image file...',
      removeImage: 'Remove Image',
    },
    tn: {
      title: 'Dira Poso',
      placeholder: 'O akanya eng? Abelana ka megopolo, botlhale kgotsa dipotso le setšhaba...',
      tags: 'Dintlha',
      addTag: '+ Tsenya Ntlha',
      anonymous: 'Poso e sa itsiweng',
      comments: 'Letla dikakanyo',
      saveDraft: 'Boloka Thulaganyo',
      post: 'Poso',
      pollOption: 'Kgetho ya Dipotsolotso',
      addOption: 'Tsenya Kgetho',
      questionPlaceholder: 'Botsa potso ya gago fano...',
      titlePlaceholder: 'Tsenya setlhogo sa poso ya gago...',
      uploadImage: 'Tsenya Setshwantsho',
      imagePlaceholder: 'Kgetha faele ya setshwantsho...',
      removeImage: 'Tlosa Setshwantsho',
    },
  };

  const t = texts[language];

  // FIXED: Updated mutation to handle image upload
  // FIXED: Updated mutation to handle base64 image upload (NO MULTER)
const createPostMutation = useMutation({
  mutationFn: async (postData: any) => {
    // If there's an image file, convert it to base64
    if (imageFile) {
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(imageFile);
      });
      
      // Use the new endpoint that handles base64 images
      postData.imageData = base64Image;
      const response = await apiRequest("POST", "/api/posts-with-image", postData);
      return response;
    } else {
      // Use regular post endpoint for non-image posts
      await apiRequest("POST", "/api/posts", postData);
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/posts-with-authors"] });
    toast({
      title: language === 'en' ? "Success" : "Katlego",
      description: language === 'en' ? "Post created successfully!" : "Poso e dirilwe ka katlego!",
    });
    resetForm();
    onClose();
  },
  onError: (error) => {
    if (isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    toast({
      title: language === 'en' ? "Error" : "Phoso",
      description: language === 'en' ? "Failed to create post" : "Go paleletswe go dira poso",
      variant: "destructive",
    });
  },
});

  const resetForm = () => {
    setPostType('text');
    setContent('');
    setTitle('');
    setSelectedTags([]);
    setCustomTag('');
    setIsAnonymous(false);
    setAllowComments(true);
    setPollOptions(['', '']);
    setImageFile(null);
    setImagePreview(null);
  };

  // FIXED: Handle image file selection with preview
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: language === 'en' ? 'Invalid file' : 'Faele e siyo',
          description: language === 'en' ? 'Please select an image file' : 'Ka kopo kgetha faele ya seswantšho',
          variant: "destructive",
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: language === 'en' ? 'File too large' : 'Faele e kgolo go feta',
          description: language === 'en' ? 'Please select an image smaller than 5MB' : 'Ka kopo kgetha seswantšho se se botlana ko 5MB',
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: language === 'en' ? "Error" : "Phoso",
        description: language === 'en' ? "Please enter some content" : "Tsweetswee tsenya diteng",
        variant: "destructive",
      });
      return;
    }

    // For image posts, require an image
    if (postType === 'image' && !imageFile) {
      toast({
        title: language === 'en' ? "Error" : "Phoso",
        description: language === 'en' ? "Please select an image for your post" : "Ka kopo kgetha setshwantsho mabapi le poso ya gago",
        variant: "destructive",
      });
      return;
    }

    const postData: any = {
      type: postType,
      content: content.trim(),
      title: title.trim() || undefined,
      tags: selectedTags,
      isAnonymous,
      allowComments,
    };

    if (postType === 'poll') {
      const validOptions = pollOptions.filter(option => option.trim());
      if (validOptions.length < 2) {
        toast({
          title: language === 'en' ? "Error" : "Phoso",
          description: language === 'en' ? "Please provide at least 2 poll options" : "Tsweetswee neelane dikgetho di le 2 kana go feta",
          variant: "destructive",
        });
        return;
      }
      postData.pollOptions = validOptions.map(option => ({ text: option, votes: 0 }));
    }

    // Image will be handled in the mutation function
    createPostMutation.mutate(postData);
  };

  const handleTagSelect = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag)) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const renderPostTypeSelector = () => (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {postTypes.map((type) => {
        const Icon = type.icon;
        return (
          <Button
            key={type.id}
            variant={postType === type.id ? "default" : "outline"}
            size="sm"
            onClick={() => setPostType(type.id)}
            className={`flex items-center space-x-2 whitespace-nowrap ${
              postType === type.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Icon size={16} />
            <span>{type.label[language]}</span>
          </Button>
        );
      })}
    </div>
  );

  // FIXED: Updated image editor with preview
  const renderContentEditor = () => {
    switch (postType) {
      case 'question':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{language === 'en' ? 'Question Title' : 'Setlhogo sa Potso'}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.titlePlaceholder}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="content">{language === 'en' ? 'Question Details' : 'Tlhaloso ya Potso'}</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.questionPlaceholder}
                rows={4}
                className="mt-1 resize-none"
              />
            </div>
          </div>
        );

      case 'poll':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="content">{language === 'en' ? 'Poll Question' : 'Potso ya Dipotsolotso'}</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={language === 'en' ? 'Ask your poll question...' : 'Botsa potso ya gago ya dipotsolotso...'}
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
            <div>
              <Label>{language === 'en' ? 'Poll Options' : 'Dikgetho tsa Dipotsolotso'}</Label>
              <div className="space-y-2 mt-2">
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => updatePollOption(index, e.target.value)}
                      placeholder={`${t.pollOption} ${index + 1}`}
                      className="flex-1"
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePollOption(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPollOption}
                    className="w-full"
                  >
                    <Plus size={16} className="mr-1" />
                    {t.addOption}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="image">{t.uploadImage}</Label>
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mt-1">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">{t.imagePlaceholder}</p>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('image')?.click()}
                  >
                    {t.uploadImage}
                  </Button>
                </div>
              ) : (
                <div className="relative mt-1">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2"
                  >
                    <X size={16} />
                    {t.removeImage}
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="content">{language === 'en' ? 'Caption' : 'Tlhaloso'}</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={language === 'en' ? 'Write a caption for your image...' : 'Kwala tlhaloso ya setshwantsho sa gago...'}
                rows={4}
                className="mt-1 resize-none"
              />
            </div>
          </div>
        );

      default:
        return (
          <div>
            <Label htmlFor="content">{language === 'en' ? 'Content' : 'Diteng'}</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t.placeholder}
              rows={6}
              className="mt-1 resize-none"
            />
          </div>
        );
    }
  };

  const renderTagSelector = () => (
    <div className="space-y-3">
      <Label>{t.tags}</Label>
      <div className="flex flex-wrap gap-2">
        {predefinedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant={selectedTags.includes(tag.id) ? "default" : "outline"}
            className={`cursor-pointer ${
              selectedTags.includes(tag.id) ? 'bg-primary text-white' : tag.color
            }`}
            onClick={() => handleTagSelect(tag.id)}
          >
            {tag.label[language]}
          </Badge>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <Input
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          placeholder={language === 'en' ? 'Add custom tag...' : 'Tsenya ntlha ya gago...'}
          className="flex-1"
          onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddCustomTag}
          disabled={!customTag.trim()}
        >
          <Plus size={16} />
        </Button>
      </div>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
              <X size={12} className="ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {renderPostTypeSelector()}
          {renderContentEditor()}
          {renderTagSelector()}
          
          {/* Post Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral">{t.anonymous}</span>
              <Switch
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral">{t.comments}</span>
              <Switch
                checked={allowComments}
                onCheckedChange={setAllowComments}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={resetForm}
              className="flex-1"
            >
              <Save size={16} className="mr-1" />
              {t.saveDraft}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPostMutation.isPending || !content.trim() || (postType === 'image' && !imageFile)}
              className="flex-1 bg-primary hover:bg-blue-600"
            >
              <Send size={16} className="mr-1" />
              {createPostMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                t.post
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
