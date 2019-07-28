require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const MOVIEBANK = require('./movies.json');

const app = express();

const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'dev';
app.use(morgan(morganSetting));
app.use(helmet());
app.use(cors());

app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN;
    const authToken = req.get('Authorization');

    if(!authToken || apiToken !== authToken.split(' ')[1]) {
        return res.status(401).json({ error: 'Unauthorized request' })
    }
    
    next();
})

function handleGetMovies(req, res) {
    const { genre, country, avg_vote} = req.query;
    //Set our res results to the full MOVIEBANK array. If a user does not specify
    //any query parameters we will return the full array
    let results = MOVIEBANK;
    
    //Check to see if the user supplied genre
    if(genre) {
        //Filter through the results to find movies with genres that match with the req genre
        results = results.filter(movie => 
            movie.genre.toLowerCase().includes(genre.toLowerCase()) 
        );
        //Check to see if we have any matches. If not supply an error message in the res
        if(!results.length) {
           return res.status(400).json({error:`Could not find any results for genre that match ${genre}`})
        }
    }

    //Check to see if user supplied country
    if(country) {
        //Filter through the results to find movies with the country that matches with the req country
        results = results.filter(movie =>
            movie.country.toLowerCase().includes(country.toLowerCase()) 
        );
        //Check to see if we have any matches. If not supply an error message in the res
        if(!results.length) {
           return res.status(400).json({error: `Could not find any results for country that match ${country}`})
        }
    }

    //Check to see if the user supplied avg_vote.
    if(avg_vote) {
        // Convert avg_vote to a number
        const avgVoteToNum = parseFloat(avg_vote);
        //Check if avg_vote supplied by req is NaN. If NaN return status 400.
        if(Number.isNaN(avgVoteToNum)) {
           return res.status(400).json({error: 'avg_vote must be a number'})
        }
        //Filter through the results to find movies with an average vote that is greater than or equal
        //to the number supplied in the req
        results = results.filter(movie => 
            avgVoteToNum <= parseFloat(movie.avg_vote) 
        );
        //Check to see if we have any matches. If not supply an error message in the res
        if(!results.length) {
            return res.status(400).json({error: `Could not find and results with avg_vote greater than or equal to ${avgVoteToNum}`});
            
        }
    }

    res.json(results);
}

app.get('/movie', handleGetMovies)

app.use((error, req, res, next) => {
    let response;
    if(process.env.NODE_ENV === 'production'){
        response = { error: { message: 'server error' }}
    } else {
        response = { error }
    }
    res.status(500).json(response);
})

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {});