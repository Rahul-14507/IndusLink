def rank_flagged_assets(scores: list) -> list:
    """
    Ranks flagged assets based on priority:
    1. Highest final score descending (-final_score)
    2. Worst incident severity descending (-worst_incident_severity)
    3. Asset criticality descending (-asset_criticality)
    
    Supports both dictionaries and objects.
    """
    def get_val(item, attr):
        if isinstance(item, dict):
            return item.get(attr)
        return getattr(item, attr, None)

    return sorted(
        scores,
        key=lambda s: (
            -float(get_val(s, "final_score") or 0.0),
            -int(get_val(s, "worst_incident_severity") or 0),
            -int(get_val(s, "asset_criticality") or 0),
        )
    )
