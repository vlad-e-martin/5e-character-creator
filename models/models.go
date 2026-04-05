package models

// The standard shape of a result from /api/2014/:endpoint
type ApiResult struct {
	Index string `json:"index"`
	Name  string `json:"name"`
	URL   string `json:"url"`
}

// The standard shape of a list of results from /api/2014/:endpoint
type ApiResultList struct {
	Count   int         `json:"count"`
	Results []ApiResult `json:"results"`
}

// --- SPECIALIZED PROPERTY TYPES ---

type AbilityBonus struct {
	AbilityScore ApiResult `json:"ability_score"`
	Bonus        int       `json:"bonus"`
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

// --- TOP-LEVEL RESULT TYPES ---

type ClassResult struct {
	Index              string              `json:"index"`
	Name               string              `json:"name"`
	HitDie             int                 `json:"hit_die"`
	SavingThrows       []ApiResult         `json:"saving_throws"`
	SubClasses         []ApiResult         `json:"subclasses"`
	ProficiencyChoices []ProficiencyChoice `json:"proficiency_choices"`
	URL                string              `json:"url"`
	UpdatedAt          string              `json:"updated_at"`
}

type RaceResult struct {
	Index          string         `json:"index"`
	Name           string         `json:"name"`
	Speed          int            `json:"speed"`
	AbilityBonuses []AbilityBonus `json:"ability_bonuses"`
	AlignmentDesc  string         `json:"alignment"`
	AgeDesc        string         `json:"age"`
	Size           string         `json:"size"`
	SizeDesc       string         `json:"size_description"`
	Languages      []ApiResult    `json:"languages"`
	LanguageDesc   string         `json:"language_desc"`
	Traits         []ApiResult    `json:"traits"`
	SubRaces       []ApiResult    `json:"subraces"`
	URL            string         `json:"url"`
	UpdatedAt      string         `json:"updated_at"`
}

type ParentRaceResult struct {
	Index     string `json:"index"`
	Name      string `json:"name"`
	URL       string `json:"url"`
	UpdatedAt string `json:"updated_at"`
}

type SubRaceResult struct {
	Index          string           `json:"index"`
	Name           string           `json:"name"`
	Race           ParentRaceResult `json:"race"`
	Desc           string           `json:"desc"`
	AbilityBonuses []AbilityBonus   `json:"ability_bonuses"`
	RacialTraits   []ApiResult      `json:"racial_traits"`
	URL            string           `json:"url"`
	UpdatedAt      string           `json:"updated_at"`
}

// Skill Result Type
type SkillResult struct {
	Index        string    `json:"index"`
	Name         string    `json:"name"`
	Desc         []string  `json:"desc"`
	AbilityScore ApiResult `json:"ability_score"`
	URL          string    `json:"url"`
	UpdatedAt    string    `json:"updated_at"`
}

// Background Result type
type BackgroundResult struct {
	Index                 string      `json:"index"`
	Name                  string      `json:"name"`
	StartingProficiencies []ApiResult `json:"starting_proficiencies"`
}
