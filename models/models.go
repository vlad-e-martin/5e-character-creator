package models

// The standard shape of a result from /api/2014/:endpoint
type ApiResult struct {
	Index string `json:"index"`
	Name  string `json:"name"`
	URL   string `json:"url,omitempty"` // Not relevant in custom format
}

// The standard shape of a list of results from /api/2014/:endpoint
type ApiResultList struct {
	Count   int         `json:"count"`
	Results []ApiResult `json:"results"`
}

// --- SPECIALIZED PROPERTY TYPES ---

type AbilityBonus struct {
	Bonus         int         `json:"bonus"`
	AbilityScore  *ApiResult  `json:"ability_score,omitempty"`  // Rigid API format
	AbilityScores []ApiResult `json:"ability_scores,omitempty"` // Flexible custom format
}

// --- PROFICIENCY CHOICES TYPES ---

type ReferenceOption struct {
	OptionType string    `json:"option_type"`
	Item       ApiResult `json:"item"`
}

type ProficiencyOptionSet struct {
	OptionSetType string            `json:"option_set_type"`
	Options       []ReferenceOption `json:"options"`
}

type ProficiencyChoice struct {
	Desc   string               `json:"desc"`
	Choose int                  `json:"choose"`
	Type   string               `json:"type"`
	From   ProficiencyOptionSet `json:"from"`
}

type BonusOption struct {
	Desc    string         `json:"desc"`
	Bonuses []AbilityBonus `json:"bonuses"`
}

// --- TOP-LEVEL RESULT TYPES ---

type ClassResult struct {
	Index              string              `json:"index"`
	Name               string              `json:"name"`
	HitDie             int                 `json:"hit_die"`
	SavingThrows       []ApiResult         `json:"saving_throws"`
	SubClasses         []ApiResult         `json:"subclasses"`
	ProficiencyChoices []ProficiencyChoice `json:"proficiency_choices"`
	URL                string              `json:"url,omitempty"`        // Not relevant in custom format
	UpdatedAt          string              `json:"updated_at,omitempty"` // Not relevant in custom format
}

type RaceResult struct {
	Index               string         `json:"index"`
	Name                string         `json:"name"`
	Speed               int            `json:"speed"`
	RawAbilityBonuses   []AbilityBonus `json:"ability_bonuses,omitempty"` // Captured from API
	AbilityBonusOptions []BonusOption  `json:"ability_bonus_options"`     // Custom unified format
	AlignmentDesc       string         `json:"alignment"`
	AgeDesc             string         `json:"age"`
	Size                string         `json:"size"`
	SizeDesc            string         `json:"size_description"`
	Languages           []ApiResult    `json:"languages"`
	LanguageDesc        string         `json:"language_desc"`
	Traits              []ApiResult    `json:"traits"`
	SubRaces            []ApiResult    `json:"subraces"`
	URL                 string         `json:"url,omitempty"`        // Not relevant in custom format
	UpdatedAt           string         `json:"updated_at,omitempty"` // Not relevant in custom format
}

type ParentRaceResult struct {
	Index     string `json:"index"`
	Name      string `json:"name"`
	URL       string `json:"url,omitempty"`        // Not relevant in custom format
	UpdatedAt string `json:"updated_at,omitempty"` // Not relevant in custom format
}

type SubRaceResult struct {
	Index               string           `json:"index"`
	Name                string           `json:"name"`
	Race                ParentRaceResult `json:"race"`
	Desc                string           `json:"desc"`
	RawAbilityBonuses   []AbilityBonus   `json:"ability_bonuses,omitempty"` // Captured from API
	AbilityBonusOptions []BonusOption    `json:"ability_bonus_options"`     // Custom unified format
	RacialTraits        []ApiResult      `json:"racial_traits"`
	URL                 string           `json:"url,omitempty"`        // Not relevant in custom format
	UpdatedAt           string           `json:"updated_at,omitempty"` // Not relevant in custom format
}

// Skill Result Type
type SkillResult struct {
	Index        string    `json:"index"`
	Name         string    `json:"name"`
	Desc         []string  `json:"desc"`
	AbilityScore ApiResult `json:"ability_score"`
	URL          string    `json:"url,omitempty"`        // Not relevant in custom format
	UpdatedAt    string    `json:"updated_at,omitempty"` // Not relevant in custom format
}

// Background Result type
type BackgroundResult struct {
	Index                 string      `json:"index"`
	Name                  string      `json:"name"`
	StartingProficiencies []ApiResult `json:"starting_proficiencies"`
}
