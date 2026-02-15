# Database Schema Design

## PostgreSQL Schema for Game Dating CRM

### Tables Overview

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster email lookups
CREATE INDEX idx_users_email ON users(email);

-- Leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    profile_photo_url VARCHAR(500),
    platform_origin VARCHAR(50) NOT NULL CHECK (platform_origin IN (
        'Tinder', 'Bumble', 'Instagram', 'Facebook', 'WhatsApp', 'Offline', 'Other'
    )),
    country_of_origin VARCHAR(100),
    personality_traits TEXT,
    notes TEXT,
    qualification_score INTEGER CHECK (qualification_score >= 1 AND qualification_score <= 10),
    funnel_stage VARCHAR(20) NOT NULL DEFAULT 'Stage1' CHECK (funnel_stage IN (
        'Stage1', 'Stage2', 'Stage3', 'Stage4', 'Lover', 'Dead'
    )),
    origin_details VARCHAR(500), -- where/how met
    temperature VARCHAR(10) DEFAULT 'Cold' CHECK (temperature IN ('Cold', 'Warm', 'Hot')),
    last_interaction_date TIMESTAMP WITH TIME ZONE,
    stage_entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for leads table
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_funnel_stage ON leads(funnel_stage);
CREATE INDEX idx_leads_platform_origin ON leads(platform_origin);
CREATE INDEX idx_leads_last_interaction ON leads(last_interaction_date);
CREATE INDEX idx_leads_temperature ON leads(temperature);

-- Interactions table
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN (
        'Message', 'Call', 'Date', 'Meeting', 'Other'
    )),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('Incoming', 'Outgoing')),
    notes TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for interactions
CREATE INDEX idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX idx_interactions_occurred_at ON interactions(occurred_at);

-- Function to update last_interaction_date automatically
CREATE OR REPLACE FUNCTION update_lead_last_interaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE leads 
    SET 
        last_interaction_date = NEW.occurred_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_interaction_date
CREATE TRIGGER trigger_update_lead_interaction
    AFTER INSERT OR UPDATE ON interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_last_interaction();

-- Function to update temperature based on recent activity
CREATE OR REPLACE FUNCTION calculate_lead_temperature(lead_uuid UUID)
RETURNS VARCHAR(10) AS $$
DECLARE
    days_since_last_interaction INTEGER;
    recent_interaction_count INTEGER;
    calculated_temp VARCHAR(10);
BEGIN
    -- Calculate days since last interaction
    SELECT COALESCE(
        EXTRACT(DAY FROM CURRENT_TIMESTAMP - last_interaction_date)::INTEGER, 
        999
    ) INTO days_since_last_interaction
    FROM leads WHERE id = lead_uuid;
    
    -- Count interactions in last 7 days
    SELECT COUNT(*) INTO recent_interaction_count
    FROM interactions 
    WHERE lead_id = lead_uuid 
    AND occurred_at >= CURRENT_TIMESTAMP - INTERVAL '7 days';
    
    -- Calculate temperature
    IF days_since_last_interaction <= 2 AND recent_interaction_count >= 3 THEN
        calculated_temp := 'Hot';
    ELSIF days_since_last_interaction <= 7 AND recent_interaction_count >= 1 THEN
        calculated_temp := 'Warm';
    ELSE
        calculated_temp := 'Cold';
    END IF;
    
    RETURN calculated_temp;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

## Data Relationships

```
users (1) ──── (many) leads (1) ──── (many) interactions
   │                    │
   └── CASCADE DELETE   └── CASCADE DELETE
```

## Sample Data Structure

### User Record
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "password_hash": "$2b$12$...",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

### Lead Record
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Sarah Johnson",
  "profile_photo_url": "/uploads/photos/456e7890.jpg",
  "platform_origin": "Tinder",
  "country_of_origin": "United States",
  "personality_traits": "Outgoing, loves hiking, coffee enthusiast",
  "notes": "Met through mutual friend recommendation",
  "qualification_score": 8,
  "funnel_stage": "Stage2",
  "origin_details": "Coffee shop downtown",
  "temperature": "Warm",
  "last_interaction_date": "2024-01-15T14:30:00Z",
  "stage_entered_at": "2024-01-10T09:00:00Z",
  "created_at": "2024-01-05T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

### Interaction Record
```json
{
  "id": "789e0123-e89b-12d3-a456-426614174002",
  "lead_id": "456e7890-e89b-12d3-a456-426614174001",
  "interaction_type": "Message",
  "direction": "Outgoing",
  "notes": "Asked about weekend plans",
  "occurred_at": "2024-01-15T14:30:00Z",
  "created_at": "2024-01-15T14:32:00Z"
}
```

## Query Examples

### Get leads by funnel stage with days since last interaction
```sql
SELECT 
    l.*,
    CASE 
        WHEN l.last_interaction_date IS NULL THEN 999
        ELSE EXTRACT(DAY FROM CURRENT_TIMESTAMP - l.last_interaction_date)::INTEGER
    END as days_since_last_spoken
FROM leads l
WHERE l.user_id = $1 
    AND l.funnel_stage = $2
ORDER BY l.qualification_score DESC;
```

### Get lead origin distribution
```sql
SELECT 
    platform_origin,
    COUNT(*) as lead_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM leads 
WHERE user_id = $1 
    AND funnel_stage != 'Dead'
GROUP BY platform_origin
ORDER BY lead_count DESC;
```

### Get funnel statistics
```sql
SELECT 
    funnel_stage,
    COUNT(*) as lead_count
FROM leads 
WHERE user_id = $1 
    AND funnel_stage NOT IN ('Dead', 'Lover')
GROUP BY funnel_stage
ORDER BY 
    CASE funnel_stage
        WHEN 'Stage1' THEN 1
        WHEN 'Stage2' THEN 2
        WHEN 'Stage3' THEN 3
        WHEN 'Stage4' THEN 4
    END;
```

### Update lead temperature for all leads
```sql
UPDATE leads 
SET temperature = calculate_lead_temperature(id)
WHERE user_id = $1;
```

## Performance Considerations

1. **Indexing Strategy**
   - Primary keys automatically indexed
   - Foreign keys indexed for JOIN operations
   - Funnel stage indexed for filtering
   - Last interaction date indexed for sorting
   - Platform origin indexed for analytics

2. **Query Optimization**
   - Use prepared statements for frequent queries
   - Limit results with pagination
   - Avoid N+1 queries by using JOINs or batch loading

3. **Data Maintenance**
   - Regular VACUUM and ANALYZE operations
   - Monitor query performance
   - Archive old interaction data if needed

## Security Features

1. **Data Protection**
   - UUID primary keys (harder to enumerate)
   - CASCADE DELETE prevents orphaned records
   - CHECK constraints ensure data integrity
   - User isolation via user_id foreign keys

2. **Input Validation**
   - ENUM constraints on categorical fields
   - Range checks on scores (1-10)
   - Required field constraints

3. **Audit Trail**
   - Timestamps on all records
   - Interaction history preserved
   - Stage transition tracking via stage_entered_at