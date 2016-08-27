module.exports = {
    getParticipantObject : function(userId, userLocation) {
        return {
            "user_id": userId,
            "joined_at": Date.now(),
            "start_location": userLocation,
            "latest_location": userLocation,
            "visibility": true,
            "active": true,
            "terminated": false };
    }
};