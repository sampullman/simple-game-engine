import {
  escapeHtml,
  keyhandler,
  withId,
  post,
  IPostCallback,
  IPostRequest,
} from '@sampullman/simple-game-engine'
import { gameState } from './state'

let hsRank: number
let end = false
let highScorePostedCallback: IPostCallback

function fillHighScores(response) {
  let data = ''
  const { names, scores } = response
  let rank = hsRank
  if (response.ind) {
    rank = parseInt(response.ind)
    hsRank = rank
  }
  for (let i = 0; i < names.length; i += 1) {
    data += `<tr><td>${rank + i}.</td><td>${escapeHtml(names[i])}</td><td>${scores[i]}</td></tr>`
  }
  withId('scores')?.html(data)
  end = names.length < 10
}

function getHighScores(rank: number) {
  let submitRank = rank
  if (submitRank <= -9 || (submitRank > hsRank && end)) {
    return
  }
  if (rank < 1) {
    submitRank = 1
  }
  end = false
  hsRank = submitRank
  post('/portfolio/query/', { query: 'get_highscores', rank: submitRank }, fillHighScores)
}

function highScorePosted(response: IPostRequest) {
  if (response.refresh === '1') {
    fillHighScores(response)
  }
  if (highScorePostedCallback) {
    highScorePostedCallback()
  }
  withId('submit_highscore')?.hide()
}

function submitHighscore() {
  const name = escapeHtml(withId('highscore_name').val())
  if (name.length < 2 || name.length > 20) {
    alert('Name must be between 2 and 20 characters (inclusive).')
    return
  }
  post(
    '/portfolio/query/',
    {
      query: 'set_highscore',
      name,
      val: gameState.score.toString(),
    },
    highScorePosted,
  )
}

function feedbackPosted(_response) {
  alert('Your feedback has been recorded. Thanks a bunch!')
}

function submitFeedback() {
  let text = withId('feedback_input').text()
  if (text.length > 500) {
    text = text.substring(0, 499)
  }
  post(
    '/portfolio/query/',
    {
      query: 'submit_feedback',
      text,
    },
    feedbackPosted,
  )
}

function initHighScores(callback) {
  highScorePostedCallback = callback
  getHighScores(1)
  withId('highscore_button')!.onclick = submitHighscore
  withId('hs_left')!.onclick = () => {
    getHighScores(hsRank - 10)
  }
  withId('hs_right')!.onclick = () => {
    getHighScores(hsRank + 10)
  }
  withId('hs_goto_button')!.onclick = () => {
    getHighScores(parseInt(withId('hs_goto')!.val()))
  }
  withId('feedback_button')!.onclick = submitFeedback
  withId('feedback_input')!.onfocusin = keyhandler.start
  withId('feedback_input')!.onfocusout = keyhandler.stop
}

export { initHighScores } // eslint-disable-line
