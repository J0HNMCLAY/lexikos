import os
import json
import string

def load_words():
    return
    '''Initial function run to break the dictionary up into chunks by letter'''
    with open(WORDS_DIR+OFILE) as word_file:
        valid_words = set(word_file.read().split())

    # Process words from text file
    valid_words = list(valid_words)
    valid_words.sort()

    # Set processing vars
    currentInitial = valid_words[0]
    currentLetter  = []
    
    for index, word in enumerate(valid_words):
        #-Add words to array
        if word[0]==currentInitial:
            currentLetter.append(word)

        if word[0]!=currentInitial or word==valid_words[-1]:
            # Write to initial json file (per letter)
            Write_ByInitial(currentInitial, currentLetter)
            #-Finish up
            if currentInitial=='z':
                break

            #-Update processing vars
            currentInitial = word[0]
            currentLetter.clear()
            currentLetter.append(word)

    return valid_words

def Write_ByInitial(_initial, _wordArray):
    initialUpper = UC[ LC.index(_initial) ]
    fileName = initialUpper + '.json';
    #
    print('Writing file::{file}'.format(file=fileName))
    with open(WORDS_WIP_DIR+fileName, 'w+') as output:
        json.dump(_wordArray, output)


def Get_Letter_Stats():
    '''Prints select stats from each letter to the console'''
    wordList = []
    for index, item in enumerate(UC):
        fileName = '{letter}.json'.format(letter=item)
        with open(WORDS_WIP_DIR+fileName, 'r') as wList:
            wordList = json.load(wList)

        #-Stats
        fileSize = os.path.getsize(WORDS_WIP_DIR+fileName)
        output = 'Letter::{letter} - {entries} entries | Size::{size:.2f} KB'.format(letter=item, entries=len(wordList), size=(fileSize/1024) )
        print( output )

def Find_Word(_word):
    '''Check if a word exists in the .json dictionary'''
    initial = _word[0].upper()
    fileName = initial + '.json';
    #
    found = False
    word = _word.lower()
    #
    with open(WORDS_WIP_DIR+fileName, 'r') as rFile:
        wordList = json.load(rFile)
        if word in wordList: 
            found = True
            print('Dictionary contains::"{w}" in {jfile}'.format(w=word, jfile=fileName))

    if found is False: print('Dictionary DOES NOT contain::"{w}" in {jfile}'.format(w=word, jfile=fileName))
    

#--------------------------------------------------------------------#
#----------------------------- MAIN ---------------------------------#
def Main():
    pass
    #Get_Letter_Stats()
    Find_Word('japzzz')



    #-Load and Test
    #english_words = load_words()
    #print('zebra' in english_words)

    

# Globals
WORDS_WIP_DIR = './Words_WIP/'
WORDS_DIR = './Words/'
OFILE     = 'words_alpha.txt'
UC = list( string.ascii_uppercase )
LC = list( string.ascii_lowercase )
WORD_LIST = [['' for i in range(1)] for j in range(27)]

if __name__ == '__main__': Main()

