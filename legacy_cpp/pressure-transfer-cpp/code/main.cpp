#include "davleniya.h"

#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    Davleniya w;
    w.show();
    return a.exec();
}
