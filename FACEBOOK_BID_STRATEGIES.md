# Facebook Bid Strategies Guide

## 🎯 **Available Facebook Bid Strategies**

### **1. LOWEST_COST_WITHOUT_CAP (Default)**
- **What it does**: Facebook automatically bids to get the lowest cost per result
- **Best for**: Most advertisers, especially when starting out
- **When to use**: When you want Facebook to optimize for the best possible cost
- **Limitation**: No control over maximum cost per result

### **2. LOWEST_COST_WITH_BID_CAP**
- **What it does**: Facebook bids to get the lowest cost, but won't exceed your bid cap
- **Best for**: Advertisers who want cost control
- **When to use**: When you have a specific cost target in mind
- **Requires**: `bid_amount` field to be set

### **3. COST_CAP**
- **What it does**: Facebook tries to spend your budget while staying under the cost cap
- **Best for**: Advertisers with strict cost requirements
- **When to use**: When you need to guarantee a maximum cost per result
- **Requires**: `bid_amount` field to be set

### **4. BID_CAP**
- **What it does**: You set a maximum bid amount for each auction
- **Best for**: Experienced advertisers who want full control
- **When to use**: When you understand your audience value well
- **Requires**: `bid_amount` field to be set

### **5. ABSOLUTE_OCPM**
- **What it does**: Optimized cost per mille (thousand impressions) with absolute control
- **Best for**: Brand awareness campaigns
- **When to use**: When you want to control cost per thousand impressions
- **Requires**: `bid_amount` field to be set

## 📊 **Current Implementation Status**

### **✅ What We Have:**
- **Default Strategy**: Currently using `LOWEST_COST_WITHOUT_CAP` implicitly
- **Bid Amount**: Available in `FacebookAdSetData` interface (`bid_amount?: number`)
- **Budget Control**: Daily budget and lifetime budget support

### **❌ What We're Missing:**
- **Bid Strategy Selection**: No UI to choose between different strategies
- **Bid Amount Input**: No field for users to set bid amounts
- **Strategy-Specific Fields**: No conditional fields based on selected strategy

## 🔧 **Recommended Implementation**

### **Add to Template Form:**
```typescript
// In template form state
bidStrategy: 'LOWEST_COST_WITHOUT_CAP' as 'LOWEST_COST_WITHOUT_CAP' | 'LOWEST_COST_WITH_BID_CAP' | 'COST_CAP' | 'BID_CAP' | 'ABSOLUTE_OCPM',
bidAmount?: number,
```

### **Add to UI:**
```typescript
<div className="space-y-2">
  <Label>Bid Strategy</Label>
  <Select 
    value={templateForm.bidStrategy}
    onValueChange={(value) => setTemplateForm({ 
      ...templateForm, 
      bidStrategy: value as BidStrategyType
    })}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select bid strategy" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="LOWEST_COST_WITHOUT_CAP">Lowest Cost (Recommended)</SelectItem>
      <SelectItem value="LOWEST_COST_WITH_BID_CAP">Lowest Cost with Bid Cap</SelectItem>
      <SelectItem value="COST_CAP">Cost Cap</SelectItem>
      <SelectItem value="BID_CAP">Bid Cap</SelectItem>
      <SelectItem value="ABSOLUTE_OCPM">Absolute oCPM</SelectItem>
    </SelectContent>
  </Select>
</div>

{/* Show bid amount field only for strategies that need it */}
{(templateForm.bidStrategy === 'LOWEST_COST_WITH_BID_CAP' || 
  templateForm.bidStrategy === 'COST_CAP' || 
  templateForm.bidStrategy === 'BID_CAP' || 
  templateForm.bidStrategy === 'ABSOLUTE_OCPM') && (
  <div className="space-y-2">
    <Label>Bid Amount</Label>
    <Input
      type="number"
      value={templateForm.bidAmount || ''}
      onChange={(e) => setTemplateForm({ 
        ...templateForm, 
        bidAmount: e.target.value ? parseFloat(e.target.value) : undefined 
      })}
      placeholder="0.00"
    />
  </div>
)}
```

### **Update Facebook API Mapping:**
```typescript
// In mapTemplateToAdSet function
return {
  name: adSetName,
  campaign_id: campaignId,
  daily_budget: budget * 100,
  billing_event: template.billingEvent || 'IMPRESSIONS',
  optimization_goal: template.optimizationGoal || 'LINK_CLICKS',
  bid_strategy: template.bidStrategy || 'LOWEST_COST_WITHOUT_CAP',
  bid_amount: template.bidAmount ? template.bidAmount * 100 : undefined, // Convert to cents
  targeting: { /* ... */ },
  status: 'PAUSED',
  special_ad_categories: template.specialAdCategories || [],
};
```

## 🎯 **Priority Recommendation**

**Add bid strategy selection as a medium priority feature** because:
- ✅ **Not critical for basic ad creation** - Facebook defaults work well
- ✅ **Enhances user control** - Advanced users will appreciate it
- ✅ **Improves cost optimization** - Better control over ad spend
- ✅ **Industry standard** - Most ad platforms offer bid strategy options

## 📈 **Impact on Ad Performance**

### **LOWEST_COST_WITHOUT_CAP** (Current Default)
- **Pros**: Best cost optimization, Facebook handles everything
- **Cons**: No cost control, can spend more than expected

### **LOWEST_COST_WITH_BID_CAP** (Recommended Addition)
- **Pros**: Good cost optimization with safety net
- **Cons**: May limit reach if bid cap is too low

### **COST_CAP** (Advanced)
- **Pros**: Guaranteed cost control
- **Cons**: May not spend full budget if cap is too restrictive 