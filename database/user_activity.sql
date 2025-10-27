-- User Activity Tracking for Parkchain
-- Track user actions and create activity feed

-- Create user_activity table
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'reservation_created',
        'reservation_cancelled',
        'charging_session_started',
        'charging_session_ended',
        'review_posted',
        'favorite_added',
        'points_earned',
        'badge_unlocked',
        'ticket_created',
        'marketplace_purchase',
        'profile_updated'
    )),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    activity_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_related ON user_activity(related_entity_type, related_entity_id);

-- Create view for recent activity with details
CREATE OR REPLACE VIEW user_activity_details AS
SELECT
    ua.*,
    u.full_name as user_name,
    u.email as user_email,
    CASE
        WHEN ua.activity_type = 'reservation_created' THEN 'Utworzono rezerwację'
        WHEN ua.activity_type = 'reservation_cancelled' THEN 'Anulowano rezerwację'
        WHEN ua.activity_type = 'charging_session_started' THEN 'Rozpoczęto ładowanie'
        WHEN ua.activity_type = 'charging_session_ended' THEN 'Zakończono ładowanie'
        WHEN ua.activity_type = 'review_posted' THEN 'Dodano recenzję'
        WHEN ua.activity_type = 'favorite_added' THEN 'Dodano do ulubionych'
        WHEN ua.activity_type = 'points_earned' THEN 'Zdobyto punkty'
        WHEN ua.activity_type = 'badge_unlocked' THEN 'Odblokowano odznakę'
        WHEN ua.activity_type = 'ticket_created' THEN 'Utworzono zgłoszenie'
        WHEN ua.activity_type = 'marketplace_purchase' THEN 'Dokonano zakupu'
        WHEN ua.activity_type = 'profile_updated' THEN 'Zaktualizowano profil'
        ELSE ua.activity_type
    END as activity_description
FROM user_activity ua
LEFT JOIN users u ON ua.user_id = u.id;

-- Function to log activity automatically
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_related_entity_type VARCHAR(50) DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL,
    p_activity_data JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activity (user_id, activity_type, related_entity_type, related_entity_id, activity_data)
    VALUES (p_user_id, p_activity_type, p_related_entity_type, p_related_entity_id, p_activity_data)
    RETURNING id INTO activity_id;

    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE user_activity IS 'User activity tracking and history';
COMMENT ON FUNCTION log_user_activity IS 'Helper function to log user activities';
