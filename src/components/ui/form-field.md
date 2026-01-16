# FormField Component

A comprehensive form field component with floating labels, error messages, validation feedback, and enhanced accessibility.

## Features

- **Floating Labels**: Smooth animated labels that float above the input when focused or filled
- **Error States**: Visual error indicators with inline error messages
- **Helper Text**: Contextual help text below inputs
- **Character Count**: Optional character counter for length-limited inputs
- **Validation Feedback**: Real-time visual feedback for input validation
- **Accessibility**: Full ARIA support with proper labeling and error associations
- **Smooth Animations**: Polished transitions for all state changes

## Usage

### Basic Input

```tsx
<FormField
  id="email"
  label="Email Address"
  type="email"
  required
/>
```

### Input with Error

```tsx
<FormField
  id="password"
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
  required
/>
```

### Textarea with Character Count

```tsx
<FormField
  id="description"
  label="Description"
  type="textarea"
  maxLength={200}
  showCharCount
  helperText="Provide a detailed description of your issue"
/>
```

### Controlled Input

```tsx
const [value, setValue] = useState('')

<FormField
  id="name"
  label="Full Name"
  type="text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  required
/>
```

### Non-Floating Label

```tsx
<FormField
  id="username"
  label="Username"
  type="text"
  floating={false}
  placeholder="Enter your username"
/>
```

## Props

### FormField Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | **Required** | Unique identifier for the field |
| `label` | `string` | **Required** | Label text |
| `type` | `string \| 'textarea'` | `'text'` | Input type or 'textarea' |
| `error` | `string` | `undefined` | Error message to display |
| `helperText` | `string` | `undefined` | Helper text below input |
| `floating` | `boolean` | `true` | Enable floating label style |
| `showCharCount` | `boolean` | `false` | Show character counter |
| `required` | `boolean` | `false` | Mark field as required |
| `className` | `string` | `undefined` | Additional wrapper class |
| `maxLength` | `number` | `undefined` | Maximum character length |
| `value` | `string` | `undefined` | Controlled value |
| `defaultValue` | `string` | `undefined` | Uncontrolled default value |
| `onChange` | `function` | `undefined` | Change event handler |
| `onFocus` | `function` | `undefined` | Focus event handler |
| `onBlur` | `function` | `undefined` | Blur event handler |

All standard HTML input/textarea attributes are also supported.

## Examples

### Form with Validation

```tsx
function MyForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    bio: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const newErrors: Record<string, string> = {}
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit form
    await submitForm(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        id="email"
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        required
      />

      <FormField
        id="password"
        label="Password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        error={errors.password}
        required
        helperText="Must be at least 8 characters"
      />

      <FormField
        id="bio"
        label="Bio"
        type="textarea"
        value={formData.bio}
        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        maxLength={500}
        showCharCount
        helperText="Tell us about yourself"
      />

      <Button type="submit">Submit</Button>
    </form>
  )
}
```

## Accessibility

The FormField component is fully accessible and follows WCAG 2.1 AA guidelines:

- **Label Association**: Labels are properly associated with inputs using `htmlFor` and `id`
- **Error Announcement**: Errors are marked with `role="alert"` for screen reader announcement
- **ARIA Attributes**:
  - `aria-invalid` is set to `"true"` when there's an error
  - `aria-describedby` links to error messages, helper text, and character counts
  - `aria-live="polite"` on character count for dynamic updates
- **Required Fields**: Visually indicated with an asterisk and `required` attribute
- **Focus Management**: Proper focus indicators on all interactive elements
- **Keyboard Navigation**: Full keyboard support for all interactions

## Styling

The component uses Tailwind CSS with design system tokens for consistent styling:

- **Colors**: Uses semantic color tokens (destructive, muted-foreground, etc.)
- **Transitions**: Smooth 200ms transitions with ease-in-out easing
- **Focus States**: Clear focus rings following focus-visible pattern
- **Error States**: Red borders, backgrounds, and text for errors
- **Animations**: Entrance animations for error messages using animate-in

## Best Practices

1. **Always provide unique IDs**: Each FormField needs a unique `id` for proper label association
2. **Use error prop for validation**: Pass validation errors to the `error` prop for proper display
3. **Required fields**: Set `required={true}` for required fields
4. **Character limits**: Use `maxLength` with `showCharCount` for length-limited inputs
5. **Helper text**: Provide context with `helperText` for complex fields
6. **Controlled vs Uncontrolled**: Choose based on your needs:
   - Controlled: Use `value` and `onChange` for full control
   - Uncontrolled: Use `defaultValue` for simpler forms

## Component Variants

### Input Types

All standard HTML5 input types are supported:
- `text`, `email`, `password`, `number`, `tel`, `url`, `search`, `date`, `time`, etc.

### Textarea

Use `type="textarea"` for multi-line text input:

```tsx
<FormField
  id="message"
  label="Message"
  type="textarea"
  rows={5}
  maxLength={1000}
  showCharCount
/>
```

## Migration Guide

If you're upgrading from separate Input/Label components:

**Before:**
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email *</Label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
  />
  {error && <p className="text-sm text-destructive">{error}</p>}
</div>
```

**After:**
```tsx
<FormField
  id="email"
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
  required
/>
```

## Performance

The FormField component is optimized for performance:
- Minimal re-renders using React.useState for internal state
- Efficient event handlers that don't create new functions on each render
- Conditional rendering for optional features (error, helper text, character count)
- No external dependencies beyond the UI library

## Browser Support

Fully supported in all modern browsers:
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Android (last 2 versions)
