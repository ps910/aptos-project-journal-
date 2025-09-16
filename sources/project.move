module MyModule::OpenJournal {

    use aptos_framework::signer;
    use std::vector;
    use std::string::{Self, String};
    use aptos_framework::timestamp;

    /// Struct representing an idea submission
    struct Idea has store, copy, drop {
        id: u64,
        title: String,
        description: String,
        author: address,
        votes: u64,
        timestamp: u64,
    }

    /// Struct representing the journal that stores all ideas
    struct Journal has key {
        ideas: vector<Idea>,
        next_idea_id: u64,
        total_ideas: u64,
    }

    /// Struct to track user votes to prevent double voting
    struct UserVotes has key {
        voted_ideas: vector<u64>,
    }

    /// Initialize the journal for an account
    public fun initialize_journal(account: &signer) {
        let journal = Journal {
            ideas: vector::empty<Idea>(),
            next_idea_id: 1,
            total_ideas: 0,
        };
        move_to(account, journal);
    }

    /// Submit a new idea to the journal
    public fun submit_idea(
        author: &signer, 
        journal_owner: address, 
        title: String, 
        description: String
    ) acquires Journal {
        let journal = borrow_global_mut<Journal>(journal_owner);
        
        let new_idea = Idea {
            id: journal.next_idea_id,
            title,
            description,
            author: signer::address_of(author),
            votes: 0,
            timestamp: timestamp::now_seconds(),
        };
        
        vector::push_back(&mut journal.ideas, new_idea);
        journal.next_idea_id = journal.next_idea_id + 1;
        journal.total_ideas = journal.total_ideas + 1;
    }

    /// Vote for an idea (users can only vote once per idea)
    public fun vote_for_idea(
        voter: &signer, 
        journal_owner: address, 
        idea_id: u64
    ) acquires Journal, UserVotes {
        let voter_addr = signer::address_of(voter);
        
        // Initialize user votes if not exists
        if (!exists<UserVotes>(voter_addr)) {
            let user_votes = UserVotes {
                voted_ideas: vector::empty<u64>(),
            };
            move_to(voter, user_votes);
        };
        
        let user_votes = borrow_global_mut<UserVotes>(voter_addr);
        
        // Check if user already voted for this idea
        let already_voted = vector::contains(&user_votes.voted_ideas, &idea_id);
        assert!(!already_voted, 1); // Error code 1: Already voted
        
        // Add vote
        let journal = borrow_global_mut<Journal>(journal_owner);
        let ideas_len = vector::length(&journal.ideas);
        let i = 0;
        
        while (i < ideas_len) {
            let idea = vector::borrow_mut(&mut journal.ideas, i);
            if (idea.id == idea_id) {
                idea.votes = idea.votes + 1;
                break
            };
            i = i + 1;
        };
        
        // Record the vote
        vector::push_back(&mut user_votes.voted_ideas, idea_id);
    }

    /// Get idea by ID
    public fun get_idea(journal_owner: address, idea_id: u64): (String, String, address, u64, u64) acquires Journal {
        let journal = borrow_global<Journal>(journal_owner);
        let ideas_len = vector::length(&journal.ideas);
        let i = 0;
        
        while (i < ideas_len) {
            let idea = vector::borrow(&journal.ideas, i);
            if (idea.id == idea_id) {
                return (idea.title, idea.description, idea.author, idea.votes, idea.timestamp)
            };
            i = i + 1;
        };
        
        // Return empty values if not found
        (string::utf8(b""), string::utf8(b""), @0x0, 0, 0)
    }

    /// Get total number of ideas in the journal
    public fun get_total_ideas(journal_owner: address): u64 acquires Journal {
        let journal = borrow_global<Journal>(journal_owner);
        journal.total_ideas
    }
}