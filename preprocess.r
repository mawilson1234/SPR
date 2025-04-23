library(tidyverse)
library(data.table)

# User-defined function to read in PCIbex Farm results files
read.pcibex <- function(
	filepath, 
	colnames.from,
	auto.colnames = TRUE, 
	fun.col = \(col, cols) {
			cols[cols == col] <- paste(col, 'Ibex', sep = '.')
			return (cols)
		}
	) {
	
	get.colnames <- function(filepath) {
		cols <- c()
		con <- file(filepath, 'r')
		while (TRUE) {
			line <- readLines(con, n = 1, warn = FALSE)
			if (length(line) == 0) {
				break
			}
			
			m <- regmatches(line, regexec(r'(^# (\d+)\. (.+)\.,*?$)', line))[[1]]
			if (length(m) == 3) {
				index <- as.numeric(m[2])
				value <- m[3]
				if (is.function(fun.col)) {
					cols <- fun.col(value, cols)
				}
				cols[index] <- value
				if (index == n.cols) {
					break
				}
			}
		}
		close(con)
		
		return (cols)
	}
	
	n.cols <- max(count.fields(filepath, sep = ',', quote = NULL), na.rm = TRUE)
	if (auto.colnames) {
		cols <- get.colnames(filepath)
		
		# this happens due to a data coding errors we've fixed
		if (is.null(cols)) {
			cols <- get.colnames(colnames.from)
		}
		
		return (read.csv(filepath, comment.char = '#', header = FALSE, col.names = cols))
	}
	else {
		return (read.csv(filepath, comment.char = '#', header = FALSE, col.names = seq_len(n.cols)))
	}
}

df <- read.pcibex('results.csv') |>
	as_tibble() |>
	mutate(
		participant = paste0(Results.reception.time, MD5.hash.of.participant.s.IP.address),
		participant = match(participant, unique(participant))
	) |>
	select(-Results.reception.time, -MD5.hash.of.participant.s.IP.address) |>
	select(participant, everything())

# pull out demographics info
demographics <- df |>
	filter(grepl('^demographics', Parameter)) |>
	select(participant, Parameter, Value) |> 
	group_by(participant) |>
	mutate(
		Parameter = gsub('^demographics_', '', Parameter),
		nlanguages = Value[Parameter == 'nlanguages']
	) |> 
	ungroup() |>
	filter(
		(Parameter == 'nlanguages') |
		(nlanguages == 'monolingual' & grepl('-mono_', Parameter)) |
		(nlanguages == 'bilingual' & grepl('-bi_', Parameter)) |
		(nlanguages == 'multilingual' & grepl('-multi_', Parameter))
	) |>
	select(-nlanguages) |>
	mutate(Parameter = gsub('-(mono|bi|multi)_', '_', Parameter)) |>
	rename(
		question = Parameter,
		response = Value
	)
	
demographics |>
	fwrite('demographics.csv', row.names = FALSE)

# pull out sentences and questions separately, then rejoin
reading <- df |>
	filter(PennElementName == 'EPDashedSentence') |>
	select(
		participant, Parameter, Value, 
		item, sentence, condition, Reading.time
	) |>
	rename(
		word_number = Parameter,
		word = Value,
		reading_time = Reading.time
	) |>
	mutate(
		sentence = gsub('%2C', ',', sentence) |>
			trimws()
	)

questions <- df |>
	filter(PennElementName == 'QuestionAlt') |>
	select(
		participant, Value, item:Newline.
	) |>
	rename(
		response = Value,
		accuracy = Reading.time,
		response_time = Newline.
	) |>
	mutate(
		sentence = gsub('%2C', ',', sentence) |>
			trimws()
	) |>
	select(
		participant, item:question,
		correct_answer, response, accuracy:response_time
	)

# recombine
df <- reading |>
	left_join(questions)

df <- df |>
	select(
		participant, item, condition, sentence, 
		word_number, word, reading_time, question, 
		correct_answer, response, accuracy, response_time
	)

df |>
	fwrite('cleaned_results.csv', row.names = FALSE)