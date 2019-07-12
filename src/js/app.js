App = {
    web3Provider: null,
    contracts : {},
    account: '0x',
    hasVoted: false,

    initWeb3 : ()=> {
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        console.log('web3 is initialized');
        return App.initContract();
    },

    initContract: ()=> {
        $.getJSON("Election.json", (election)=> {
            // Instantiate a new truffle contract from the artifact
            App.contracts.Election = TruffleContract(election);
            // Connect provider to interact with contract
            App.contracts.Election.setProvider(App.web3Provider);
            console.log('Contract is initialized');
            App.listenForEvents();
            return App.render();
        })
    },

    listenForEvents: ()=> {
        console.log('Listining for events');
        App.contracts.Election.deployed().then((instance)=> {
            instance.voted({},{
                fromBlock: 0,
                toBlock: 'latest'
            }).watch((err, event)=> {
                if(err) {
                    console.log("error in event trigger", err);
                } else {
                    console.log("event triggered", event);
                    // Reload when a new vote is recorded
                    App.render();
                }
            })
        })
    },

    render: ()=> {
        let electionInstance;
        let loader = $('#loader');
        let content = $('#content');

        loader.show();
        content.hide();

        // load account address

        // Load account data
        web3.eth.getCoinbase((err, account)=> {
            if (err === null) {
                App.account = account;
                $("#accountAddress").html("Your Account: " + account);
            }
        });

        App.contracts.Election.deployed().then( (instance) => {
            electionInstance = instance;
            return electionInstance.candidateCount();
        }).then( (res)=> {
            const candidateCount = res['c'][0];
            let candidatesResults = $("#candidatesResults");
            candidatesResults.empty();

            let candidatesSelect = $('#candidatesSelect');
            candidatesSelect.empty();

            for (let i = 1; i <= candidateCount; i++) {
                electionInstance.candidates(i).then((candidate)=> {
                  let id = candidate[0];
                  let name = candidate[1];
                  let voteCount = candidate[2];
        
                  // Render candidate Result
                  let candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
                  candidatesResults.append(candidateTemplate);
        
                  // Render candidate ballot option
                  let candidateOption = "<option value='" + id + "' >" + name + "</ option>"
                  candidatesSelect.append(candidateOption);
                });
              }
              loader.hide();
              content.show();
              return electionInstance.voters(App.account);
        }).then((hasVoted)=> {
            // Do not allow a user to vote
            if(hasVoted) {
                $('form').hide();
            }
            loader.hide();
            content.show();
        }).catch((error)=> {
            console.warn(error);
        });
    },
    castVote: ()=> {
        var candidateId = parseInt($('#candidatesSelect').val());
        App.contracts.Election.deployed().then((instance)=> {
            return instance.vote(candidateId,{ from: App.account });
        }).then(function(result) {
        // Wait for votes to update
            $("#content").hide();
            $("#loader").show();
        }).catch(function(err) {
            console.error(err);
        });
    }
}

$(()=> {
    $(window).load(()=> {
      App.initWeb3();
    });
});