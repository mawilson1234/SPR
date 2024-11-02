// This is a PCIbex implementation of a simple self-paced reading task for
// CGSC/LING 496/696 @ University of Delaware

// Michael Wilson, November 2024
// CC-BY

PennController.ResetPrefix(null) // Shorten command names (keep this)
DebugOff()

var centered_justified_style = {
	'text-align': 'justify', 
	margin: '0 auto', 
	'margin-bottom': '3em',
	width: '30em',
	'font-size': '16px',
	'font-family': 'Helvetica, sans-serif'
}

var trial_style = {
	'font-family': 'Helvetica, sans-serif',
	'font-size': '48px'
}

Sequence(
	'instructions',
	randomize('trial') ,
	SendResults(),
	'end'
)

newTrial('instructions',
	fullscreen(),
	
	newText(
		`<p>Welcome! In this experiment, we want you to read sentences one word at a time. When you are finished reading a word, push the space button to show the next word.</p><p>
			Afterward, you will see a question about the sentence you read.</p><p>
			Push the "f" key if you think the answer on the left is correct, and "j" if you think the answer on the right is correct.</p><p>
			Try to read at a natural pace, and respond to the questions as quickly and accurately as possible.</p><p>
		`
	)
		.css(centered_justified_style)
		.print()		
	,
	
	newButton('Click when you are ready to begin')
		.css('font-family', 'Helvetica, sans-serif')
		.css('font-size', '16px')
		.center()
		.print()
		.wait()
).setOption('countsForProgressBar', false)

Template('stimuli.csv', currentrow => 
	newTrial(
		'trial',
		
		newText(`cross`, `+`)
			.css(trial_style)
			.print('center at 50%', 'middle at 50%')
		,
		
		newTimer('wait1', 2000)
			.start()
			.wait()
		,
		
		getText(`cross`).remove(),
		
		newController(
			'EPDashedSentence',
			{s: currentrow.SENTENCE}
		)
			.print()
			.log()
			.wait()
			.remove()
		,
		
		newController(
			'QuestionAlt', {
				q: currentrow.QUESTION, 
				as: [['f', currentrow.LEFT_ANSWER], ['j', currentrow.RIGHT_ANSWER]],
				randomOrder: false,
				presentHorizontally: true,
				hasCorrect: currentrow.LEFT_ANSWER == currentrow.CORRECT_ANSWER ? 0 : 1
			}
		)
			.print()
			.log()
			.wait()
			.remove()
	)
		.log('sentence',       currentrow.SENTENCE)
		.log('question',       currentrow.QUESTION)
		.log('correct_answer', currentrow.CORRECT_ANSWER)
)

newTrial('end',
	exitFullscreen()
	,
	
	newText('The is the end of the experiment, you can now close this window. Thank you!')
		.css(trial_style)
		.center()
		.print('center at 50%', 'bottom at 80%')
	,
	
	newButton()
		.wait()
)
.setOption('countsForProgressBar', false)