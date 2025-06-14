// This is a PCIbex implementation of a simple self-paced reading task for
// CGSC/LING 496/696 @ University of Delaware

// Michael Wilson, April 2025
// CC-BY

PennController.ResetPrefix(null) // Shorten command names (keep this)
DebugOff()

var centered_justified_style = {
	'text-align': 'justify', 
	margin: '0 auto', 
	'margin-bottom': '3em',
	width: '30em'
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
		`<p>Welcome! In this experiment, you will read sentences one word at a time. 
			When you are finished reading a word, push the space bar to show the next word.</p>
		<p>Afterward, you will see a question about the sentence you read.</p>
		<p>Push the "f" key if you think the answer on the left is correct, and "j" if you think the answer on the right is correct.</p>
		<p>Try to read at a natural pace, and respond to the questions as quickly and accurately as possible.</p><p>
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
		
		newController(
			'Separator', {
				transfer: 2000,
				normalMessage: '+',
				ignoreFailure: true
			}
		)
			.center()
			.print()
			.wait()
			.remove()
		,
		
		newController(
			'EPDashedSentence', {
				s: currentrow.sentence,
				mode: 'self-paced reading',
				display: 'in place'
			}
		)
			.center()
			.print()
			.log()
			.wait()
			.remove()
		,
		
		newController(
			'QuestionAlt', {
				q: currentrow.question, 
				as: [['f', currentrow.left_answer], ['j', currentrow.right_answer]],
				randomOrder: false,
				presentHorizontally: true,
				hasCorrect: currentrow.left_answer == currentrow.correct_answer ? 0 : 1
			}
		)
			.center()
			.print()
			.log()
			.wait()
			.remove()
	)
		.log('item',           currentrow.item)
		.log('sentence',       currentrow.sentence)
		.log('condition',      currentrow.condition)
		.log('question',       currentrow.question)
		.log('correct_answer', currentrow.correct_answer)
)

newTrial('end',
	exitFullscreen()
	,
	
	newText('This is the end of the experiment, you can now close this window. Thank you!')
		.css(centered_justified_style)
		.center()
		.print()
	,
	
	newButton()
		.wait()
)
.setOption('countsForProgressBar', false)