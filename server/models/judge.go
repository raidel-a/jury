package models

import (
	"encoding/json"
	"fmt"
	"math/rand"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Judge struct {
	Id           primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Token        string               `bson:"token" json:"token"`
	Code         string               `bson:"code" json:"code"`
	Name         string               `bson:"name" json:"name"`
	Email        string               `bson:"email" json:"email"`
	Active       bool                 `bson:"active" json:"active"`
	Track        string               `bson:"track" json:"track"`
	Group        int64                `bson:"group" json:"group"`
	ReadWelcome  bool                 `bson:"read_welcome" json:"read_welcome"`
	Notes        string               `bson:"notes" json:"notes"`
	Current      *primitive.ObjectID  `bson:"current" json:"current"`
	LastLocation int64                `bson:"last_location" json:"last_location"`
	Seen         int64                `bson:"seen" json:"seen"`
	GroupSeen    int64                `bson:"group_seen" json:"group_seen"` // Projects seen in the group
	SeenProjects []JudgedProject      `bson:"seen_projects" json:"seen_projects"`
	Rankings     []primitive.ObjectID `bson:"rankings" json:"rankings"`
	RankingsAgg  []AggRanking         `bson:"rankings_agg" json:"rankings_agg"` // Aggregation for ranking scoring
	Flagged      []primitive.ObjectID `bson:"flagged" json:"flagged"`           // Projects that the judge has flagged (not ranked)
	LastActivity primitive.DateTime   `bson:"last_activity" json:"last_activity"`
}

type JudgedProject struct {
	ProjectId       primitive.ObjectID `bson:"project_id" json:"project_id"`
	Name            string             `bson:"name" json:"name"`
	Location        int64              `bson:"location" json:"location"`
	Description     string             `bson:"description" json:"description"`

	// Core rating system
	CriteriaRating  CriteriaRating     `bson:"criteria_rating" json:"criteria_rating"`
	Starred         bool               `bson:"starred" json:"starred"`        // Standout projects
	Comments        string             `bson:"comments" json:"comments"`      // Personal feedback (renamed from Notes)

	// Calculated and manual ranking
	CalculatedScore float64            `bson:"calculated_score" json:"calculated_score"` // Auto from criteria
	ManualRank      int                `bson:"manual_rank" json:"manual_rank"`           // Judge's override

	Timestamp       primitive.DateTime `bson:"timestamp" json:"timestamp"`
}

type CriteriaRating struct {
	Completion  int `bson:"completion" json:"completion"`   // 1-5: Does the hack work? Did the team achieve everything they wanted?
	Originality int `bson:"originality" json:"originality"` // 1-5: Has this been done before? How creative is their project?
	Learning    int `bson:"learning" json:"learning"`       // 1-5: Did the team stretch themselves? Did they try to learn something new?
	Design      int `bson:"design" json:"design"`           // 1-5: Did the team put thought into the UX? How well-designed was the UI?
	Technical   int `bson:"technical" json:"technical"`     // 1-5: How technically impressive was the hack? Was the problem tackled difficult?
}

type AggRanking struct {
	ProjectId primitive.ObjectID `bson:"project_id,omitempty" json:"project_id"`
	Score     int64              `bson:"score" json:"score"`
}

func NewJudge(name string, email string, track string, notes string, group int64) *Judge {
	return &Judge{
		Token:        "",
		Code:         RandCode(),
		Name:         name,
		Email:        email,
		Active:       true,
		Group:        group,
		Track:        track,
		ReadWelcome:  false,
		Notes:        notes,
		Current:      nil,
		LastLocation: -1,
		Seen:         0,
		GroupSeen:    0,
		SeenProjects: []JudgedProject{},
		Rankings:     []primitive.ObjectID{},
		RankingsAgg:  []AggRanking{},
		Flagged:      []primitive.ObjectID{},
		LastActivity: primitive.DateTime(0),
	}
}

// RandCode generates a random 8 digit code
func RandCode() string {
	return fmt.Sprintf("%d", rand.Intn(90000000)+10000000)
}

func JudgeProjectFromProject(project *Project, comments string, starred bool, criteriaRating CriteriaRating) *JudgedProject {
	calculatedScore := CalculateProjectScore(criteriaRating, starred)
	return &JudgedProject{
		ProjectId:       project.Id,
		Name:            project.Name,
		Location:        project.Location,
		Description:     project.Description,
		CriteriaRating:  criteriaRating,
		Starred:         starred,
		Comments:        comments,
		CalculatedScore: calculatedScore,
		ManualRank:      0, // Will be set when judge arranges rankings
		Timestamp:       primitive.DateTime(0),
	}
}

// CalculateProjectScore computes the score based on criteria ratings and star status
func CalculateProjectScore(rating CriteriaRating, starred bool) float64 {
	// Base score: average of 5 criteria (1-5 scale = 0.2-1.0 normalized)
	baseScore := float64(rating.Completion+rating.Originality+rating.Learning+
		rating.Design+rating.Technical) / 25.0 // Normalize to 0-1

	// Star bonus: +0.1 for standout projects
	starBonus := 0.0
	if starred {
		starBonus = 0.1
	}

	return baseScore + starBonus // Final score 0.2-1.1 range
}

// IsValidCriteriaRating checks if all criteria are properly rated (1-5)
func IsValidCriteriaRating(rating CriteriaRating) bool {
	criteria := []int{rating.Completion, rating.Originality, rating.Learning, rating.Design, rating.Technical}
	for _, score := range criteria {
		if score < 1 || score > 5 {
			return false
		}
	}
	return true
}

// AutoGenerateRanking creates a ranking based on calculated scores
func (j *Judge) AutoGenerateRanking() {
	// Create a copy of seen projects for sorting
	projects := make([]JudgedProject, len(j.SeenProjects))
	copy(projects, j.SeenProjects)

	// Sort by calculated score (highest first)
	for i := 0; i < len(projects); i++ {
		for k := i + 1; k < len(projects); k++ {
			if projects[k].CalculatedScore > projects[i].CalculatedScore {
				projects[i], projects[k] = projects[k], projects[i]
			}
		}
	}

	// Extract project IDs in rank order and update manual ranks
	j.Rankings = make([]primitive.ObjectID, len(projects))
	for i, project := range projects {
		j.Rankings[i] = project.ProjectId
		// Update manual rank in the original seen projects
		for k := range j.SeenProjects {
			if j.SeenProjects[k].ProjectId == project.ProjectId {
				j.SeenProjects[k].ManualRank = i + 1
				break
			}
		}
	}
}

// Create custom marshal function to change the format of the primitive.DateTime to a unix timestamp
func (j *Judge) MarshalJSON() ([]byte, error) {
	type Alias Judge
	return json.Marshal(&struct {
		*Alias
		LastActivity int64 `json:"last_activity"`
	}{
		Alias:        (*Alias)(j),
		LastActivity: int64(j.LastActivity),
	})
}

// Create custom unmarshal function to change the format of the primitive.DateTime from a unix timestamp
func (j *Judge) UnmarshalJSON(data []byte) error {
	type Alias Judge
	aux := &struct {
		LastActivity int64 `json:"last_activity"`
		*Alias
	}{
		Alias: (*Alias)(j),
	}
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}
	j.LastActivity = primitive.DateTime(aux.LastActivity)
	return nil
}

func NewAggRanking(projectId primitive.ObjectID, score int64) *AggRanking {
	return &AggRanking{
		ProjectId: projectId,
		Score:     score,
	}
}

// NewDummyJudge creates a dummy judge that acts as a placeholder for system actions
// This is used for things like hiding projects when absent >3 times automatically
func NewDummyJudge() *Judge {
	dummyJudge := NewJudge("system", "", "", "", 0)
	dummyJudge.Id = primitive.NilObjectID
	return dummyJudge
}
