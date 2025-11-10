import { llmService } from '@/lib/llm/unified-service'
import { databaseService } from '@/lib/database'

export interface FormField {
  id: string
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date' | 'hidden'
  name: string
  label: string
  placeholder?: string
  required: boolean
  validation: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    custom?: string[]
  }
  options?: Array<{
    value: string
    label: string
  }>
  conditional?: {
    field: string
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
    value: string | number
    action: 'show' | 'hide' | 'enable' | 'disable'
  }
  styling: {
    width: 'full' | 'half' | 'third'
    icon?: string
    helpText?: string
  }
}

export interface FormConfiguration {
  id: string
  name: string
  description: string
  purpose: 'lead_capture' | 'contact' | 'survey' | 'registration' | 'quote_request' | 'demo_request'
  fields: FormField[]
  layout: {
    columns: 1 | 2 | 3
    spacing: 'compact' | 'normal' | 'relaxed'
    style: 'modern' | 'classic' | 'minimal'
  }
  submitButton: {
    text: string
    style: 'primary' | 'secondary' | 'outline'
    loading: boolean
  }
  successMessage: string
  errorMessage: string
  integrations: {
    email?: string[]
    crm?: {
      provider: 'salesforce' | 'hubspot' | 'pipedrive'
      apiKey: string
      mapping: Record<string, string>
    }
    webhook?: {
      url: string
      method: 'POST' | 'PUT'
      headers: Record<string, string>
    }
  }
  privacy: {
    consentRequired: boolean
    consentText: string
    gdprCompliant: boolean
  }
  analytics: {
    trackConversions: boolean
    trackFieldInteractions: boolean
    customEvents: string[]
  }
}

export interface FormGenerationRequest {
  pageContext: {
    pageType: string
    targetAudience: string
    productInfo: any
    campaignObjective: string
  }
  requirements: {
    purpose: string
    fields: string[]
    requiredFields: string[]
    conditionalLogic: boolean
    integrations: string[]
    compliance: string[]
  }
  constraints: {
    maxFields: number
    complexity: 'simple' | 'medium' | 'advanced'
    branding: any
  }
}

export interface GeneratedForm {
  configuration: FormConfiguration
  htmlCode: string
  reactCode: string
  cssCode: string
  validationSchema: any
  rationale: string
  confidence: number
}

export class AutoFormBuilderModule {
  private static instance: AutoFormBuilderModule

  static getInstance(): AutoFormBuilderModule {
    if (!AutoFormBuilderModule.instance) {
      AutoFormBuilderModule.instance = new AutoFormBuilderModule()
    }
    return AutoFormBuilderModule.instance
  }

  // Generate form based on context and requirements
  async generateForm(request: FormGenerationRequest): Promise<GeneratedForm> {
    try {
      // Step 1: Analyze requirements and context
      const analysis = await this.analyzeRequirements(request)

      // Step 2: Select appropriate form template
      const template = await this.selectFormTemplate(analysis)

      // Step 3: Generate form fields
      const fields = await this.generateFormFields(request, analysis, template)

      // Step 4: Configure form layout and styling
      const configuration = await this.configureForm(fields, request, template)

      // Step 5: Generate code implementations
      const code = await this.generateFormCode(configuration)

      // Step 6: Create validation schema
      const validationSchema = await this.generateValidationSchema(configuration)

      // Step 7: Generate rationale
      const rationale = await this.generateFormRationale(request, configuration)

      return {
        configuration,
        htmlCode: code.html,
        reactCode: code.react,
        cssCode: code.css,
        validationSchema,
        rationale,
        confidence: this.calculateFormConfidence(configuration, analysis)
      }
    } catch (error) {
      console.error('Form generation error:', error)
      throw error
    }
  }

  // Analyze form requirements
  private async analyzeRequirements(request: FormGenerationRequest): Promise<any> {
    try {
      const prompt = `
Analyze this form generation request:

PAGE CONTEXT:
${JSON.stringify(request.pageContext, null, 2)}

REQUIREMENTS:
${JSON.stringify(request.requirements, null, 2)}

CONSTRAINTS:
${JSON.stringify(request.constraints, null, 2)}

Provide analysis for:
1. Form purpose and primary goal
2. Target user expectations
3. Required fields based on purpose
4. Optimal field types
5. Privacy and compliance requirements
6. Integration needs
7. User experience considerations

Return as JSON with detailed analysis.
`

      const response = await llmService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 1000
      })

      return JSON.parse(response.content)
    } catch (error) {
      console.error('Requirements analysis error:', error)
      return {
        purpose: request.requirements.purpose,
        recommendedFields: request.requirements.fields,
        complexity: request.constraints.complexity,
        compliance: request.requirements.compliance
      }
    }
  }

  // Select appropriate form template
  private async selectFormTemplate(analysis: any): Promise<any> {
    const templates = {
      simple_contact: {
        name: 'Simple Contact Form',
        fields: ['name', 'email', 'message'],
        layout: { columns: 1, spacing: 'normal' },
        purpose: ['contact', 'lead_capture']
      },
      lead_capture: {
        name: 'Lead Capture Form',
        fields: ['name', 'email', 'company', 'phone', 'interest'],
        layout: { columns: 2, spacing: 'normal' },
        purpose: ['lead_capture', 'demo_request']
      },
      registration: {
        name: 'Registration Form',
        fields: ['name', 'email', 'password', 'company', 'role'],
        layout: { columns: 2, spacing: 'relaxed' },
        purpose: ['registration']
      },
      survey: {
        name: 'Survey Form',
        fields: ['name', 'email', 'rating', 'feedback'],
        layout: { columns: 1, spacing: 'relaxed' },
        purpose: ['survey']
      },
      quote_request: {
        name: 'Quote Request Form',
        fields: ['name', 'email', 'company', 'phone', 'requirements', 'budget'],
        layout: { columns: 2, spacing: 'normal' },
        purpose: ['quote_request']
      }
    }

    // Select template based on analysis
    const purpose = analysis.purpose || request.requirements.purpose
    const suitableTemplate = Object.values(templates).find(template =>
      template.purpose.includes(purpose)
    ) || templates.simple_contact

    return suitableTemplate
  }

  // Generate form fields
  private async generateFormFields(
    request: FormGenerationRequest,
    analysis: any,
    template: any
  ): Promise<FormField[]> {
    try {
      const prompt = `
Generate form fields based on this information:

REQUESTED FIELDS: ${request.requirements.fields.join(', ')}
REQUIRED FIELDS: ${request.requirements.requiredFields.join(', ')}
PURPOSE: ${request.requirements.purpose}
TARGET AUDIENCE: ${request.pageContext.targetAudience}
COMPLEXITY: ${request.constraints.complexity}
COMPLIANCE: ${request.requirements.compliance.join(', ')}

TEMPLATE BASE:
${JSON.stringify(template, null, 2)}

Generate comprehensive form field configurations as JSON array with:
- Field type and validation rules
- Conditional logic if needed
- Help text and placeholders
- Styling preferences
- Privacy compliance fields if required

Each field should include: id, type, name, label, required, validation, styling
`

      const response = await llmService.generateContent(prompt, {
        temperature: 0.2,
        maxTokens: 2000
      })

      let fields: FormField[]
      try {
        fields = JSON.parse(response.content)
      } catch (error) {
        // Fallback to basic fields
        fields = this.createFallbackFields(request.requirements.fields)
      }

      // Ensure required fields are included
      const requiredFields = request.requirements.requiredFields || []
      requiredFields.forEach(requiredField => {
        if (!fields.find(f => f.name === requiredField)) {
          fields.push(this.createBasicField(requiredField, true))
        }
      })

      // Add privacy consent if required
      if (request.requirements.compliance.includes('gdpr') || request.requirements.compliance.includes('privacy')) {
        fields.push(this.createConsentField())
      }

      return fields.slice(0, request.constraints.maxFields || 10)
    } catch (error) {
      console.error('Form fields generation error:', error)
      return this.createFallbackFields(request.requirements.fields)
    }
  }

  // Configure form layout and settings
  private async configureForm(
    fields: FormField[],
    request: FormGenerationRequest,
    template: any
  ): Promise<FormConfiguration> {
    const configuration: FormConfiguration = {
      id: `form_${Date.now()}`,
      name: `${request.requirements.purpose} Form`,
      description: `Auto-generated form for ${request.pageContext.pageType}`,
      purpose: request.requirements.purpose as any,
      fields,
      layout: {
        columns: request.constraints.complexity === 'simple' ? 1 : template.layout?.columns || 1,
        spacing: template.layout?.spacing || 'normal',
        style: 'modern'
      },
      submitButton: {
        text: this.getSubmitButtonText(request.requirements.purpose),
        style: 'primary',
        loading: true
      },
      successMessage: this.getSuccessMessage(request.requirements.purpose),
      errorMessage: 'Please correct the errors and try again.',
      integrations: {},
      privacy: {
        consentRequired: request.requirements.compliance.includes('gdpr'),
        consentText: 'I agree to the privacy policy and terms of service.',
        gdprCompliant: request.requirements.compliance.includes('gdpr')
      },
      analytics: {
        trackConversions: true,
        trackFieldInteractions: request.constraints.complexity === 'advanced',
        customEvents: []
      }
    }

    // Add integrations if specified
    if (request.requirements.integrations.includes('email')) {
      configuration.integrations.email = ['lead@example.com']
    }

    return configuration
  }

  // Generate form code implementations
  private async generateFormCode(configuration: FormConfiguration): Promise<{
    html: string
    react: string
    css: string
  }> {
    const html = this.generateHTMLCode(configuration)
    const react = this.generateReactCode(configuration)
    const css = this.generateCSSCode(configuration)

    return { html, react, css }
  }

  // Generate HTML code
  private generateHTMLCode(configuration: FormConfiguration): string {
    const fields = configuration.fields.map(field => this.generateHTMLField(field)).join('\n')

    return `
<form id="${configuration.id}" class="form-container" data-purpose="${configuration.purpose}">
  <div class="form-header">
    <h2>${configuration.name}</h2>
    <p>${configuration.description}</p>
  </div>

  <div class="form-fields" style="display: grid; grid-template-columns: repeat(${configuration.layout.columns}, 1fr); gap: 1rem;">
    ${fields}
  </div>

  ${configuration.privacy.consentRequired ? `
  <div class="form-consent">
    <label>
      <input type="checkbox" name="consent" required>
      ${configuration.privacy.consentText}
    </label>
  </div>
  ` : ''}

  <div class="form-actions">
    <button type="submit" class="btn btn-${configuration.submitButton.style}">
      ${configuration.submitButton.text}
    </button>
  </div>

  <div class="form-messages" style="display: none;">
    <div class="success-message">${configuration.successMessage}</div>
    <div class="error-message">${configuration.errorMessage}</div>
  </div>
</form>
`
  }

  // Generate React code
  private generateReactCode(configuration: FormConfiguration): string {
    return `
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface ${configuration.name.replace(/\s+/g, '')}FormData {
  ${configuration.fields.map(field => `  ${field.name}: ${field.type === 'checkbox' ? 'boolean' : 'string'};`).join('\n')}
}

export default function ${configuration.name.replace(/\s+/g, '')}Form() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const { register, handleSubmit, formState: { errors } } = useForm<${configuration.name.replace(/\s+/g, '')}FormData>();

  const onSubmit = async (data: ${configuration.name.replace(/\s+/g, '')}FormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formId: '${configuration.id}', data })
      });

      if (response.ok) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return <div className="form-success">${configuration.successMessage}</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-container">
      <div className="form-header">
        <h2>${configuration.name}</h2>
        <p>${configuration.description}</p>
      </div>

      <div className="form-fields">
        ${configuration.fields.map(field => this.generateReactField(field)).join('\n        ')}
      </div>

      ${configuration.privacy.consentRequired ? `
      <div className="form-consent">
        <label>
          <input type="checkbox" {...register('consent', { required: true })} />
          {configuration.privacy.consentText}
        </label>
        {errors.consent && <span className="error">Consent is required</span>}
      </div>
      ` : ''}

      <div className="form-actions">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-${configuration.submitButton.style}"
        >
          {isSubmitting ? 'Submitting...' : '${configuration.submitButton.text}'}
        </button>
      </div>

      {submitStatus === 'error' && (
        <div className="form-error">${configuration.errorMessage}</div>
      )}
    </form>
  );
}
`
  }

  // Generate CSS code
  private generateCSSCode(configuration: FormConfiguration): string {
    return `
.form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.form-header p {
  margin: 0;
  color: #666;
}

.form-fields {
  margin-bottom: 2rem;
}

.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-field input,
.form-field textarea,
.form-field select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-field input:focus,
.form-field textarea:focus,
.form-field select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-consent {
  margin-bottom: 2rem;
}

.form-consent label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.form-actions {
  text-align: center;
}

.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-success,
.form-error {
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  text-align: center;
}

.form-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.form-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.error {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .form-container {
    padding: 1rem;
  }

  .form-fields {
    grid-template-columns: 1fr !important;
  }
}
`
  }

  // Generate validation schema
  private async generateValidationSchema(configuration: FormConfiguration): Promise<any> {
    const schema: any = {
      type: 'object',
      properties: {},
      required: []
    }

    configuration.fields.forEach(field => {
      const fieldSchema: any = {
        type: field.type === 'number' ? 'number' : 'string'
      }

      if (field.validation.minLength) {
        fieldSchema.minLength = field.validation.minLength
      }

      if (field.validation.maxLength) {
        fieldSchema.maxLength = field.validation.maxLength
      }

      if (field.validation.pattern) {
        fieldSchema.pattern = field.validation.pattern
      }

      if (field.type === 'email') {
        fieldSchema.format = 'email'
      }

      schema.properties[field.name] = fieldSchema

      if (field.required) {
        schema.required.push(field.name)
      }
    })

    return schema
  }

  // Generate form rationale
  private async generateFormRationale(
    request: FormGenerationRequest,
    configuration: FormConfiguration
  ): Promise<string> {
    try {
      const prompt = `
Explain the rationale for this form configuration:

FORM CONFIGURATION:
${JSON.stringify(configuration, null, 2)}

ORIGINAL REQUEST:
${JSON.stringify(request, null, 2)}

Explain:
1. Why these specific fields were chosen
2. How the form layout optimizes user experience
3. How validation rules ensure data quality
4. How the form meets compliance requirements
5. Why this approach is likely to convert well
`

      const response = await llmService.generateContent(prompt, {
        temperature: 0.3,
        maxTokens: 800
      })

      return response.content
    } catch (error) {
      console.error('Form rationale generation error:', error)
      return `Form configured for ${configuration.purpose} with ${configuration.fields.length} fields optimized for conversion and user experience.`
    }
  }

  // Helper methods
  private createFallbackFields(requestedFields: string[]): FormField[] {
    const defaultFields = ['name', 'email', 'message']
    const fields = requestedFields.length > 0 ? requestedFields : defaultFields

    return fields.map(fieldName => this.createBasicField(fieldName, defaultFields.includes(fieldName)))
  }

  private createBasicField(name: string, required: boolean): FormField {
    const fieldTypes: Record<string, FormField['type']> = {
      name: 'text',
      email: 'email',
      phone: 'tel',
      company: 'text',
      message: 'textarea',
      budget: 'number',
      interest: 'select'
    }

    return {
      id: `field_${name}`,
      type: fieldTypes[name] || 'text',
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      required,
      validation: {},
      styling: { width: 'full' }
    }
  }

  private createConsentField(): FormField {
    return {
      id: 'field_consent',
      type: 'checkbox',
      name: 'consent',
      label: 'I agree to the privacy policy and terms of service',
      required: true,
      validation: {},
      styling: { width: 'full' }
    }
  }

  private getSubmitButtonText(purpose: string): string {
    const buttonTexts: Record<string, string> = {
      contact: 'Send Message',
      lead_capture: 'Get Started',
      registration: 'Create Account',
      survey: 'Submit Survey',
      quote_request: 'Request Quote',
      demo_request: 'Schedule Demo'
    }

    return buttonTexts[purpose] || 'Submit'
  }

  private getSuccessMessage(purpose: string): string {
    const messages: Record<string, string> = {
      contact: 'Thank you for your message. We\'ll get back to you soon!',
      lead_capture: 'Thank you for your interest! We\'ll be in touch shortly.',
      registration: 'Account created successfully!',
      survey: 'Thank you for completing the survey!',
      quote_request: 'Quote request received. We\'ll contact you soon!',
      demo_request: 'Demo request confirmed! We\'ll send scheduling details.'
    }

    return messages[purpose] || 'Form submitted successfully!'
  }

  private generateHTMLField(field: FormField): string {
    const commonAttributes = `
      name="${field.name}"
      id="${field.id}"
      placeholder="${field.placeholder || ''}"
      ${field.required ? 'required' : ''}
    `

    switch (field.type) {
      case 'textarea':
        return `
        <div class="form-field">
          <label for="${field.id}">${field.label}</label>
          <textarea ${commonAttributes} rows="4"></textarea>
        </div>
        `
      case 'select':
        const options = field.options?.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('\n') || ''
        return `
        <div class="form-field">
          <label for="${field.id}">${field.label}</label>
          <select ${commonAttributes}>
            <option value="">Select an option</option>
            ${options}
          </select>
        </div>
        `
      case 'checkbox':
        return `
        <div class="form-field">
          <label>
            <input type="checkbox" ${commonAttributes}>
            ${field.label}
          </label>
        </div>
        `
      default:
        return `
        <div class="form-field">
          <label for="${field.id}">${field.label}</label>
          <input type="${field.type}" ${commonAttributes}>
        </div>
        `
    }
  }

  private generateReactField(field: FormField): string {
    switch (field.type) {
      case 'textarea':
        return `
        <div className="form-field">
          <label htmlFor="${field.id}">${field.label}</label>
          <textarea
            {...register('${field.name}', { required: ${field.required} })}
            placeholder="${field.placeholder || ''}"
            rows={4}
          />
          {errors.${field.name} && <span className="error">${field.label} is required</span>}
        </div>
        `
      case 'select':
        return `
        <div className="form-field">
          <label htmlFor="${field.id}">${field.label}</label>
          <select {...register('${field.name}', { required: ${field.required} })}>
            <option value="">Select an option</option>
            ${field.options?.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('\n            ') || ''}
          </select>
          {errors.${field.name} && <span className="error">${field.label} is required</span>}
        </div>
        `
      case 'checkbox':
        return `
        <div className="form-field">
          <label>
            <input type="checkbox" {...register('${field.name}', { required: ${field.required} })} />
            ${field.label}
          </label>
          {errors.${field.name} && <span className="error">This field is required</span>}
        </div>
        `
      default:
        return `
        <div className="form-field">
          <label htmlFor="${field.id}">${field.label}</label>
          <input
            type="${field.type}"
            {...register('${field.name}', { required: ${field.required} })}
            placeholder="${field.placeholder || ''}"
          />
          {errors.${field.name} && <span className="error">${field.label} is required</span>}
        </div>
        `
    }
  }

  private calculateFormConfidence(configuration: FormConfiguration, analysis: any): number {
    let confidence = 0.7 // Base confidence

    // Increase confidence based on field relevance
    if (configuration.fields.length > 0 && configuration.fields.length <= 10) confidence += 0.1

    // Increase confidence for proper validation
    const hasValidation = configuration.fields.some(field => Object.keys(field.validation).length > 0)
    if (hasValidation) confidence += 0.1

    // Increase confidence for compliance
    if (configuration.privacy.gdprCompliant) confidence += 0.1

    return Math.min(confidence, 1.0)
  }
}

export const autoFormBuilderModule = AutoFormBuilderModule.getInstance()